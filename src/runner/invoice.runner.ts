import { EntityManager } from 'typeorm';
import { DynamicModule, Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { InvoiceService } from '~/invoice/invoice.service';
import { InvoiceModule } from '~/invoice/invoice.module';
import { PaymentModule } from '~/payment/payment.module';
import { PaymentInfrastructure } from '~/payment/payment.infra';
import { ShutdownService } from '~/utility/shutdown/shutdown.service';
import { DistributedLockService } from '~/utility/lock/distributed_lock.service';
import { UtilityService } from '~/utility/utility.service';

import { Runner } from './runner';

@Injectable()
export class InvoiceRunner extends Runner {
  private readonly batchSize: number;

  static forRoot(): DynamicModule {
    return {
      module: InvoiceRunner,
      imports: [PaymentModule, InvoiceModule],
    };
  }

  constructor(
    protected readonly logger: Logger,
    protected readonly distributedLockService: DistributedLockService,
    protected readonly shutdownService: ShutdownService,
    private readonly paymentInfra: PaymentInfrastructure,
    private readonly invoiceService: InvoiceService,
    private readonly utilityService: UtilityService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {
    super(InvoiceRunner.name, 5 * 60 * 1000, logger, distributedLockService, shutdownService);
    this.batchSize = 200;
  }

  async execute(entityManager?: EntityManager): Promise<void> {
    const errors: Array<{ error: any }> = [];
    const cb = async (manager: EntityManager) => {
      const paymentLogs = await this.paymentInfra.getShouldIssueInvoicePaymentLogs(this.batchSize, manager);

      for (const paymentLog of paymentLogs) {
        const { no: paymentNo } = paymentLog;
        try {
          await this.invoiceService.issueInvoiceByPayment(paymentLog, manager);
        } catch (error) {
          errors.push({ error: error.message });
          this.logger.error({
            error: JSON.stringify(error),
            title: '開立發票失敗',
            message: `paymentNo: ${paymentNo}`,
          });
        }
        await this.utilityService.sleep(100);
      }
    };
    await (entityManager ? cb(entityManager) : this.entityManager.transaction(cb));
    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }
  }
}
