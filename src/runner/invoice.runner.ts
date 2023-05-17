import { EntityManager } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { ShutdownService } from '~/utility/shutdown/shutdown.service';
import { DistributedLockService } from '~/utility/lock/distributed_lock.service';
import { UtilityService } from '~/utility/utility.service';
import { PaymentService } from '~/payment/payment.service';
import { AppService } from '~/app/app.service';
import { InvoiceService } from '~/invoice/invocie.service';

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
    private readonly invoiceService: InvoiceService,
    private readonly utilityService: UtilityService,
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

    for(const { order, no: paymentNo, options, price } of paymentLogs) {
      const { member } = order;
      const appId = member.appId;
      const card4No = options?.card4No;
      const invoiceComment = card4No ? `信用卡末四碼 ${card4No}` : options?.paymentType || '';
      try {
        const appSettings = await this.appService.getAppSettings(appId, this.entityManager);
        const appSecrets = await this.appService.getAppSecrets(appId, this.entityManager);
        const appModules = await this.appService.getAppModules(appId, this.entityManager);

        if (!this.isAllowUseInvoiceModule(appSecrets, appModules)) {
          throw new Error('Not allowed to use invoice module.');
        }
        
        this.logger.log(`issuing invoice of paymentNo: ${paymentNo}`)
        const { orderProducts, orderDiscounts, shipping, invoiceOptions } = order;
        await this.invoiceService.issueInvoice(appSecrets, paymentNo, price, {
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
        }, this.entityManager);
        await this.utilityService.sleep(100);
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