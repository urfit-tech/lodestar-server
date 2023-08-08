import { EntityManager } from 'typeorm';
import dayjs from 'dayjs';
import { DynamicModule, Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { AppService } from '~/app/app.service';
import { InvoiceService } from '~/invoice/invocie.service';
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
      providers: [AppService],
    };
  }

  constructor(
    protected readonly logger: Logger,
    protected readonly distributedLockService: DistributedLockService,
    protected readonly shutdownService: ShutdownService,
    private readonly paymentInfra: PaymentInfrastructure,
    private readonly appService: AppService,
    private readonly invoiceService: InvoiceService,
    private readonly utilityService: UtilityService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
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

  async execute(entityManager?: EntityManager): Promise<void> {
    const errors: Array<{ appId: string; error: any; }> = [];
    const cb = async (manager: EntityManager) => {
      const paymentLogs = await this.paymentInfra.getShouldIssueInvoicePaymentLogs(
        this.batchSize, manager,
      );

      for(const { order, no: paymentNo, options, price } of paymentLogs) {
        const { member } = order;
        const appId = member.appId;
        const card4No = options?.card4No;
        const invoiceComment = card4No ? `信用卡末四碼 ${card4No}` : options?.paymentType || '';
        try {
          const appSettings = await this.appService.getAppSettings(appId, manager);
          const appSecrets = await this.appService.getAppSecrets(appId, manager);
          const appModules = await this.appService.getAppModules(appId, manager);

          if (!this.isAllowUseInvoiceModule(appSecrets, appModules)) {
            throw new Error('Not allowed to use invoice module.');
          }
          
          this.logger.log(`issuing invoice of paymentNo: ${paymentNo}`)
          const { orderProducts, orderDiscounts, shipping, invoiceOptions } = order;
          
          const { Amt, invServiceResponse } = await this.invoiceService.issueInvoice(appSecrets, paymentNo, price, {
            appId,
            name: invoiceOptions['name'] || member.name,
            email: invoiceOptions['email'] || member.email,
            comment: invoiceComment,
            products: orderProducts.map((v) => ({
              name: v.name.replace(/\|/g, '｜'),
              price: v.price,
              quantity: Number(v?.options?.quantity) || 1,
            })),
            discounts: orderDiscounts.map((v) => ({
              name: v.name.replace(/\|/g, '｜'),
              price: v.price,
            })),
            shipping: shipping
              ? {
                  method: shipping?.shippingMethod?.replace(/\|/g, '｜'),
                  fee: Number(shipping?.fee) || 0,
                }
              : undefined,
            isDutyFree: appSettings['feature.duty_free.enable'] === '1',
            donationCode: invoiceOptions['donationCode'],
            phoneBarCode: invoiceOptions['phoneBarCode'],
            uniformNumber: invoiceOptions['uniformNumber'],
            uniformTitle: invoiceOptions['uniformTitle'],
            citizenCode: invoiceOptions['citizenCode'],
          });
          const invoiceNumber = invServiceResponse.Result?.['InvoiceNumber']

          const toUpdateInvoiceOptions = invServiceResponse.Status === 'SUCCESS' ? {
            invoiceTransNo: invServiceResponse.Result?.['InvoiceTransNo'],
            invoiceNumber: invoiceNumber,
          } : {
            reason: invServiceResponse.Message,
          };

          const orderLogs = await this.invoiceService.updateOrderAndPaymentLogInvoiceOptions(
            paymentNo,
            {
              status: invServiceResponse.Status,
              ...toUpdateInvoiceOptions,
            },
            invServiceResponse.Status === 'SUCCESS' ? dayjs().toDate() : undefined,
            manager,
          );

          if (invServiceResponse.Status === 'SUCCESS') {
            const orderId = orderLogs[0].id;
            if (orderId && invoiceNumber) {
              await this.invoiceService.insertInvoice(orderId, invoiceNumber, Amt, manager);
            }
          }

          await this.utilityService.sleep(100);
        } catch (error) {
          errors.push({ appId, error: error.message });
          await this.invoiceService.updateOrderAndPaymentLogInvoiceOptions(
            paymentNo, {
              status: 'LODESTAR_FAIL',
              reason: error.message,
            }, undefined, manager,
          );
          this.logger.error({
            error: JSON.stringify(error),
            appId,
            title: '開立發票失敗',
            message: `paymentNo: ${paymentNo}`,
          })
        }
      }
    };
    await (entityManager ? cb(entityManager) : this.entityManager.transaction(cb));
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
