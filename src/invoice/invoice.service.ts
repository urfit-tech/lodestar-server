import dayjs from 'dayjs';
import { EntityManager } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { AppService } from '~/app/app.service';
import { OrderInfrastructure } from '~/order/order.infra';
import { PaymentInfrastructure } from '~/payment/payment.infra';
import { PaymentLog } from '~/payment/payment_log.entity';
import { Invoice } from '~/invoice/invoice.entity';

import { EzpayClient, EzpayClientResponse } from './ezpay_client';
import { InvoiceInfrastructure } from './invoice.infra';
import { InvoiceInfo } from './invoice.dto';
import { InvoiceLog } from './invoice_log.entity';
import { InvoiceLogInfrastructure } from './invoice_log.infra';
import { sum } from 'lodash';

type InvoiceOptions = {
  appId: string;
  name: string;
  email: string;
  comment: string;
  products: { name: string; price: number; quantity: number }[];
  discounts: { name: string; price: number }[];
  shipping?: { method: string; fee: number };
  isDutyFree?: boolean;
  donationCode?: string;
  phoneBarCode?: string;
  uniformNumber?: string;
  uniformTitle?: string;
  citizenCode?: string;
  kioskPrintFlag?: string;
};

@Injectable()
export class InvoiceService {
  constructor(
    protected readonly logger: Logger,
    private readonly ezpayClient: EzpayClient,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly invoiceInfra: InvoiceInfrastructure,
    private readonly invoiceLogInfra: InvoiceLogInfrastructure,
    private readonly orderInfra: OrderInfrastructure,
    private readonly paymentInfra: PaymentInfrastructure,
    private readonly appService: AppService,
  ) {}

  public async issueInvoiceDirectly(
    appId: string,
    orderId: string,
    invoiceGatewayId: string,
    invoiceInfo: InvoiceInfo,
    manager: EntityManager,
    paymentNo?: string,
  ) {
    try {
      const appInvoiceGateway = await this.checkInvoiceGatewayConfig(appId, invoiceGatewayId, manager);
      const ezpayCredentials = EzpayClient.formCredentials(appInvoiceGateway.options);

      const result = await this.ezpayClient.issue(ezpayCredentials, invoiceInfo);
      const toUpdateInvoiceOptions =
        result.Status === 'SUCCESS'
          ? {
              invoiceTransNo: result.Result?.['InvoiceTransNo'],
              invoiceRandomNumber: result.Result?.['RandomNum'],
              invoiceNumber: result.Result?.['InvoiceNumber'],
            }
          : {
              reason: result.Message,
            };
      if (paymentNo) {
        const orderLogs = await this.updateOrderAndPaymentLogInvoiceOptionsByPaymentNo(
          paymentNo,
          {
            status: result.Status,
            ...toUpdateInvoiceOptions,
          },
          result.Status === 'SUCCESS' ? dayjs().toDate() : undefined,
          manager,
        );
        this.logger.log(`[PaymentNo: ${paymentNo}] updated order logs ${orderLogs.map(({ id }) => id).join(', ')}`);
      } else {
        const orderLogs = await this.updateOrderAndPaymentLogInvoiceOptionsByOrderId(
          orderId,
          {
            status: result.Status,
            ...toUpdateInvoiceOptions,
          },
          result.Status === 'SUCCESS' ? dayjs().toDate() : undefined,
          manager,
        );
        this.logger.log(`[OrderId: ${orderId}] updated order logs ${orderLogs.map(({ id }) => id).join(', ')}`);
      }

      if (result.Status === 'SUCCESS') {
        await this.insertInvoice(
          orderId,
          result.Result?.['InvoiceNumber'],
          result.Result?.['TotalAmt'],
          { ...result, Result: { ...invoiceInfo, ...result.Result } },
          manager,
        );
      }

      return result;
    } catch (error) {
      if (paymentNo) {
        await this.updateOrderAndPaymentLogInvoiceOptionsByPaymentNo(
          paymentNo,
          {
            status: 'LODESTAR_FAIL',
            reason: error.message,
          },
          undefined,
          manager,
        );
      }
      throw error;
    }
  }

  public async issueInvoiceByPayment(payment: PaymentLog, manager: EntityManager) {
    const { order, no: paymentNo, options, price, invoiceOptions: invoiceInfo } = payment;

    try {
      const paymentLogs = await this.paymentInfra.getPaymentLogsByOrderIds([order.id], manager);
      const invoices = await this.invoiceInfra.getInvoicesByOrderIds([order.id], manager);
      const { orderProducts, orderDiscounts, shipping, invoiceOptions } = order;
      const orderProductsPrice = orderProducts.map((prod) => prod.price);
      const paymentLogsPrice = paymentLogs.map((log) => log.price);
      const invoicePrice = invoices.map((invoice) => invoice.price);
      if (sum(paymentLogsPrice) > sum(orderProductsPrice)) {
        this.logger.log(
          `Issues Invoice Failed: the total amount exceeds by ${order.id} in payments ${paymentLogs.map(
            (log) => log.no,
          )}`,
        );
        return;
      }
      if (sum(invoicePrice) >= sum(orderProductsPrice)) {
        this.logger.log(
          `Issues Invoice Failed: the total amount exceeds by ${order.id} in invoices ${invoices.map(
            (invoice) => invoice.no,
          )}`,
        );
        return;
      }
      const { member } = order;
      const appId = member.appId;
      const card4No = options?.card4No;
      const comment = invoiceInfo?.invoiceComment;
      const invoiceComment = `${comment ? comment : card4No ? `信用卡末四碼 ${card4No}` : options?.paymentType || ''}`;

      const appSettings = await this.appService.getAppSettings(appId, manager);
      const appInvoiceGateway = await this.checkInvoiceGatewayConfig(appId, payment.invoiceGatewayId, manager);

      this.logger.log(`issuing invoice of paymentNo: ${paymentNo}`);

      const paymentLog = await this.paymentInfra.getOneByNo(paymentNo, this.entityManager);
      const merchantOrderNo = paymentLog.invoiceOptions['retry']
        ? paymentNo.replace(/-/g, '').substring(0, 20).slice(0, -1) + parseInt(paymentLog.invoiceOptions['retry'])
        : paymentNo.replace(/-/g, '').substring(0, 20);

      const { invServiceResponse } = await this.issueInvoice(appInvoiceGateway.options, price, merchantOrderNo, {
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
      const invoiceNumber = invServiceResponse.Result?.['InvoiceNumber'];
      const invoiceTransNo = invServiceResponse.Result?.['InvoiceTransNo'];
      const invoiceRandomNumber = invServiceResponse.Result?.['RandomNum'];

      const toUpdateInvoiceOptions =
        invServiceResponse.Status === 'SUCCESS'
          ? {
              invoiceTransNo: invoiceTransNo,
              invoiceRandomNumber: invoiceRandomNumber,
              invoiceNumber: invoiceNumber,
            }
          : {
              reason: invServiceResponse.Message,
            };

      const orderLogs = await this.updateOrderAndPaymentLogInvoiceOptionsByPaymentNo(
        paymentNo,
        {
          status: invServiceResponse.Status,
          ...toUpdateInvoiceOptions,
        },
        invServiceResponse.Status === 'SUCCESS' ? dayjs().toDate() : undefined,
        manager,
      );
      this.logger.log(`[PaymentNo: ${paymentNo}] updated order logs ${orderLogs.map(({ id }) => id).join(', ')}`);

      await this.insertInvoiceLog(
        merchantOrderNo,
        invServiceResponse.Status,
        invServiceResponse.Message,
        orderLogs[0].id,
        appInvoiceGateway.id,
        invoiceNumber,
        invoiceTransNo,
        invoiceRandomNumber,
        invServiceResponse,
        manager,
      );

      if (invServiceResponse.Status === 'SUCCESS') {
        const orderId = orderLogs[0].id;
        if (orderId && invoiceNumber) {
          await this.insertInvoice(orderId, invoiceNumber, price, invServiceResponse, manager);
          this.logger.log(`Invoice ${invoiceNumber} issued with order_log_id ${orderId}`);
        }
      }
    } catch (error) {
      await this.updateOrderAndPaymentLogInvoiceOptionsByPaymentNo(
        paymentNo,
        {
          status: 'LODESTAR_FAIL',
          reason: error.message,
        },
        undefined,
        manager,
      );
      throw error;
    }
  }

  public async searchInvoice(
    appId: string,
    invoiceGatewayId: string,
    invoiceNumber: string,
    invoiceRandomNumber: string,
    manager: EntityManager,
  ) {
    const appInvoiceGateway = await this.checkInvoiceGatewayConfig(appId, invoiceGatewayId, manager);

    const ezpayCredentials = EzpayClient.formCredentials(appInvoiceGateway.options);
    return this.ezpayClient.search(ezpayCredentials, { invoiceNumber, invoiceRandomNumber });
  }

  public async revokeInvoice(
    appId: string,
    invoiceGatewayId: string,
    invoiceNumber: string,
    invalidReason: string,
    manager: EntityManager,
  ) {
    const appInvoiceGateway = await this.checkInvoiceGatewayConfig(appId, invoiceGatewayId, manager);

    const ezpayCredentials = EzpayClient.formCredentials(appInvoiceGateway.options);
    const result = await this.ezpayClient.revoke(ezpayCredentials, { invoiceNumber, invalidReason });
    if (result.Status === 'SUCCESS') {
      await this.updateInvoiceRevokedAt(invoiceNumber, manager);
    }

    return result;
  }

  private async issueInvoice(
    invoiceGatewayConfig: object,
    amount: number,
    merchantOrderNo: string,
    options: InvoiceOptions,
  ) {
    let invoiceAttrs: { [key: string]: any } = {};
    if (options.donationCode) {
      invoiceAttrs = {
        Category: 'B2C',
        LoveCode: options.donationCode,
        PrintFlag: 'N',
      };
    } else if (options.phoneBarCode) {
      invoiceAttrs = {
        Category: 'B2C',
        CarrierType: 0,
        CarrierNum: options.phoneBarCode,
        PrintFlag: 'N',
      };
    } else if (options.uniformNumber) {
      invoiceAttrs = {
        Category: 'B2B',
        BuyerUBN: options.uniformNumber,
        BuyerName: options.uniformTitle,
        PrintFlag: 'Y',
      };
    } else if (options.citizenCode) {
      invoiceAttrs = {
        Category: 'B2C',
        CarrierType: 1,
        CarrierNum: options.citizenCode,
        PrintFlag: 'N',
      };
    } else if (options.kioskPrintFlag) {
      invoiceAttrs = {
        Category: 'B2C',
        PrintFlag: 'N',
        CarrierType: 2,
        KioskPrintFlag: '1',
      };
    } else if (options.email) {
      invoiceAttrs = {
        Category: 'B2C',
        PrintFlag: 'Y',
        BuyerEmail: options.email,
      };
    }

    // confirm the tax amount
    const TaxRate = options.isDutyFree ? 0 : 0.05;
    const unTaxedAmount = amount / (1 + TaxRate);

    const TaxAmt = Math.round(amount - unTaxedAmount);
    const Amt = amount - TaxAmt;

    const taxOptions = options.isDutyFree
      ? {
          TaxType: 3,
          TaxRate: 0,
          AmtFree: Amt,
        }
      : {};
    const ItemAmt = [
      ...options.products.map((product) => {
        return invoiceAttrs.Category === 'B2B'
          ? Math.round(Number(product.price) / (1 + TaxRate))
          : Number(product.price);
      }),
      ...options.discounts.map((discount) =>
        invoiceAttrs.Category === 'B2B' ? -Math.round(Number(discount.price) / (1 + TaxRate)) : -discount.price,
      ),
      ...(options.shipping?.method
        ? invoiceAttrs.Category === 'B2B'
          ? [Math.round(options.shipping.fee / (1 + TaxRate))]
          : [options.shipping.fee]
        : []),
    ].join('|');
    const ItemPrice = [
      ...options.products.map((product) => {
        return invoiceAttrs.Category === 'B2B'
          ? Math.round(Number(product.price) / (1 + TaxRate))
          : Number(product.price);
      }),
      ...options.discounts.map((discount) =>
        invoiceAttrs.Category === 'B2B' ? -Math.round(Number(discount.price) / (1 + TaxRate)) : -discount.price,
      ),
      ...(options.shipping?.method
        ? invoiceAttrs.Category === 'B2B'
          ? [Math.round(options.shipping.fee / (1 + TaxRate))]
          : [options.shipping.fee]
        : []),
    ].join('|');
    const ItemCount = [
      ...options.products.map((_) => 1),
      ...options.discounts.map((_) => 1),
      ...(options.shipping?.method ? [1] : []),
    ].join('|');

    const ItemName = [
      ...options.products.map((product) => product.name.substring(0, 25) + ` x${product.quantity}`),
      ...options.discounts.map((discount) => discount.name.substring(0, 30)),
      ...(options.shipping?.method ? [`運費 - ${options.shipping.method}`.substring(0, 30)] : []),
    ].join('|');
    const ItemUnit = Array(options.products.length + options.discounts.length)
      .fill('個')
      .concat(options.shipping?.method ? ['筆'] : [])
      .join('|');

    const ezpayCredentials = EzpayClient.formCredentials(invoiceGatewayConfig);
    const invServiceResponse = await this.ezpayClient.issue(ezpayCredentials, {
      ItemAmt,
      ItemCount,
      ItemName,
      ItemPrice,
      ItemUnit,
      Amt,
      TotalAmt: amount,
      TaxAmt,
      BuyerName: options.name || '',
      BuyerEmail: options.email || '',
      PrintFlag: 'Y',
      Comment: options.comment,
      MerchantOrderNo: merchantOrderNo,
      ...invoiceAttrs,
      ...taxOptions,
    });
    return {
      Amt,
      invServiceResponse,
    };
  }

  private updateOrderAndPaymentLogInvoiceOptionsByPaymentNo(
    paymentNo: string,
    invoiceOptions: any,
    invoiceIssueAt: Date,
    entityManager?: EntityManager,
  ) {
    const cb = async (manager: EntityManager) => {
      const orderLogs = await this.orderInfra.getManyByPaymentNo(paymentNo, manager);
      const paymentLog = await this.paymentInfra.getOneByNo(paymentNo, manager);

      for (const orderLog of orderLogs) {
        orderLog.invoiceOptions = {
          ...orderLog.invoiceOptions,
          ...invoiceOptions,
          retry: orderLog.invoiceOptions['retry'] ? parseInt(orderLog.invoiceOptions['retry']) + 1 : 1,
        };
        orderLog.invoiceIssuedAt = invoiceIssueAt;
      }
      paymentLog.invoiceOptions = {
        ...paymentLog.invoiceOptions,
        ...invoiceOptions,
        retry: paymentLog.invoiceOptions['retry'] ? parseInt(paymentLog.invoiceOptions['retry']) + 1 : 1,
      };
      paymentLog.invoiceIssuedAt = invoiceIssueAt;

      await this.paymentInfra.save(paymentLog, manager);
      return await this.orderInfra.save(orderLogs, manager);
    };
    return entityManager ? cb(entityManager) : this.entityManager.transaction(cb);
  }

  private updateOrderAndPaymentLogInvoiceOptionsByOrderId(
    orderId: string,
    invoiceOptions: any,
    invoiceIssueAt: Date,
    entityManager?: EntityManager,
  ) {
    const cb = async (manager: EntityManager) => {
      const orderLog = await this.orderInfra.getOneByOrderId(orderId, manager);

      for (const paymentLog of orderLog.paymentLogs) {
        paymentLog.invoiceOptions = {
          ...paymentLog.invoiceOptions,
          ...invoiceOptions,
          retry: paymentLog.invoiceOptions['retry'] ? parseInt(paymentLog.invoiceOptions['retry']) + 1 : 1,
        };
        paymentLog.invoiceIssuedAt = invoiceIssueAt;
        await this.paymentInfra.save(paymentLog, manager);
      }
      orderLog.invoiceOptions = {
        ...orderLog.invoiceOptions,
        ...invoiceOptions,
        retry: orderLog.invoiceOptions['retry'] ? parseInt(orderLog.invoiceOptions['retry']) + 1 : 1,
      };
      orderLog.invoiceIssuedAt = invoiceIssueAt;

      return await this.orderInfra.save(orderLog, manager);
    };
    return entityManager ? cb(entityManager) : this.entityManager.transaction(cb);
  }

  private async insertInvoice(
    orderId: string,
    invoiceNumber: string,
    price: number,
    invoiceResponse: EzpayClientResponse,
    manager: EntityManager,
  ): Promise<void> {
    const invoice = new Invoice();

    invoice.orderId = orderId;
    invoice.no = invoiceNumber;
    invoice.price = price;
    invoice.options = { ...invoiceResponse };

    delete invoice.createdAt;

    await this.invoiceInfra.save(invoice, manager);
  }

  private async insertInvoiceLog(
    merchantOrderNo: string,
    status: string,
    message: string,
    orderId: string,
    appInvoiceGatewayId: string,
    invoiceNumber: string,
    invoiceTransNo: string,
    invoiceRandomNumber: string,
    options: object,
    manager: EntityManager,
  ) {
    const invoiceLog = new InvoiceLog();

    invoiceLog.merchantOrderNo = merchantOrderNo;
    invoiceLog.status = status;
    invoiceLog.message = message;
    invoiceLog.orderId = orderId;
    invoiceLog.appInvoiceGatewayId = appInvoiceGatewayId;
    invoiceLog.invoiceNumber = invoiceNumber;
    invoiceLog.invoiceTransNo = invoiceTransNo;
    invoiceLog.invoiceRandomNumber = invoiceRandomNumber;
    invoiceLog.options = options;
    try {
      await this.invoiceLogInfra.save(invoiceLog, manager);
    } catch (err) {
      this.logger.log('Invoice Log Save Error: ', JSON.stringify(err));
    }
  }

  private async updateInvoiceRevokedAt(invoiceNumber: string, manager: EntityManager): Promise<void> {
    const invoice = manager.getRepository(Invoice);

    await invoice.update({ no: invoiceNumber }, { revokedAt: new Date() });
  }

  private isAllowUseInvoiceModule(invoiceGatewayConfig: object | null, appModules: Array<string>): boolean {
    return Boolean(
      invoiceGatewayConfig &&
        invoiceGatewayConfig['invoice.merchant_id'] &&
        invoiceGatewayConfig['invoice.hash_key'] &&
        invoiceGatewayConfig['invoice.hash_iv'] &&
        appModules.includes('invoice'),
    );
  }

  private async checkInvoiceGatewayConfig(appId: string, invoiceGatewayId: string, manager: EntityManager) {
    const appInvoiceGateway = await this.invoiceInfra.getAppInvoiceGateway(appId, invoiceGatewayId, manager);
    const appModules = await this.appService.getAppModules(appId, manager);

    if (!appInvoiceGateway || !this.isAllowUseInvoiceModule(appInvoiceGateway.options, appModules)) {
      throw new Error(`App: ${appId} invoice module is not enabled or missing settings/secrets.`);
    }

    return appInvoiceGateway;
  }
}
