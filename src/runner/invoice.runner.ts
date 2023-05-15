import { EntityManager } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { ShutdownService } from '~/utility/shutdown/shutdown.service';
import { DistributedLockService } from '~/utility/lock/distributed_lock.service';
import { PaymentService } from '~/payment/payment.service';
import { AppService } from '~/app/app.service';

import { Runner } from './runner';

@Injectable()
export class InvoiceRunner extends Runner {
  private readonly batchSize: number;

  constructor(
    protected readonly logger: Logger,
    protected readonly distributedLockService: DistributedLockService,
    protected readonly shutdownService: ShutdownService,
    private readonly paymentService: PaymentService,
    private readonly appService: AppService,
    @InjectEntityManager('phdb') private readonly entityManager: EntityManager,
  ) {
    super(
      InvoiceRunner.name,
      5 * 60 * 1000,
      logger,
      distributedLockService,
      shutdownService,
    );
    this.batchSize = 200;
  }

  async execute(): Promise<void> {
    const paymentLogs = await this.paymentService.getIssuePaymentLogs(this.batchSize);
    const errors: Array<{ appId: string; error: any; }> = [];

    for(const { order, no: paymentNo } of paymentLogs) {
      const { member } = order;
      const appId = member.appId;
      try {
        const appSecrets = await this.appService.getAppSecrets(appId, this.entityManager);
        const appModules = await this.appService.getAppModules(appId, this.entityManager);
        
        if (!this.isAllowUseInvoiceModule(appSecrets, appModules)) {
          throw new Error('Not allowed to use invoice module.');
        }
      } catch (error) {
        errors.push({ appId, error: error.message });
        this.logger.error({
          error,
          appId,
          title: '開立發票失敗',
          message: `paymentNo: ${paymentNo}`,
        })
      }
    }

    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }
  }

  private isAllowUseInvoiceModule(
    appSecrets: Record<string, string>,
    appModules: Array<string>,
  ): boolean {
    return Boolean(appSecrets['invoice.merchant_id'] &&
      appSecrets['invoice.hash_key'] &&
      appSecrets['invoice.hash_iv'] &&
      appModules.includes('invoice'));
  }
}