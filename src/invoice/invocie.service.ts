import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { Invoice } from '~/invoice/invoice.entity';
import { PaymentInfrastructure } from '~/payment/payment.infra';
import { OrderInfrastructure } from '~/order/order.infra';

import { EzpayClient } from './ezpay_client';
import { InvoiceInfrastructure } from './invoice.infra';

type InvoiceOptions = {
  appId: string
  name: string
  email: string
  comment: string
  products: { name: string; price: number; quantity: number }[]
  discounts: { name: string; price: number }[]
  shipping?: { method: string; fee: number }
  isDutyFree?: boolean
  donationCode?: string
  phoneBarCode?: string
  uniformNumber?: string
  uniformTitle?: string
  citizenCode?: string
}

@Injectable()
export class InvoiceService {
  constructor(
    private readonly ezpayClient: EzpayClient,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly invoiceInfra: InvoiceInfrastructure,
    private readonly orderInfra: OrderInfrastructure,
    private readonly paymentInfra: PaymentInfrastructure,
  ) {}

  async issueInvoice(
    appSecrets: Record<string, string>,
    paymentNo: string,
    amount: number,
    options: InvoiceOptions,
  ) {
    let invoiceAttrs: { [key: string]: any } = {}
    if (options.donationCode) {
      invoiceAttrs = {
        Category: 'B2C',
        LoveCode: options.donationCode,
        PrintFlag: 'N',
      }
    } else if (options.phoneBarCode) {
      invoiceAttrs = {
        Category: 'B2C',
        CarrierType: 0,
        CarrierNum: options.phoneBarCode,
        PrintFlag: 'N',
      }
    } else if (options.uniformNumber) {
      invoiceAttrs = {
        Category: 'B2B',
        BuyerUBN: options.uniformNumber,
        BuyerName: options.uniformTitle,
        PrintFlag: 'Y',
      }
    } else if (options.citizenCode) {
      invoiceAttrs = {
        Category: 'B2C',
        CarrierType: 1,
        CarrierNum: options.citizenCode,
        PrintFlag: 'N',
      }
    } else if (options.email) {
      invoiceAttrs = {
        Category: 'B2C',
        PrintFlag: 'Y',
        BuyerEmail: options.email,
      }
    }

    // confirm the tax amount
    const TaxRate = options.isDutyFree ? 0 : 0.05
    const unTaxedAmount = amount / (1 + TaxRate)

    const TaxAmt = Math.round(amount - unTaxedAmount)
    const Amt = amount - TaxAmt

    const taxOptions = options.isDutyFree
      ? {
          TaxType: 3,
          TaxRate: 0,
          AmtFree: Amt,
        }
      : {}
    const ItemAmt = [
      ...options.products.map((product) => {
        return invoiceAttrs.Category === 'B2B' ? Math.round(Number(product.price) / (1 + TaxRate)) : Number(product.price)
      }),
      ...options.discounts.map((discount) =>
        invoiceAttrs.Category === 'B2B' ? -Math.round(Number(discount.price) / (1 + TaxRate)) : -discount.price,
      ),
      ...(options.shipping?.method
        ? invoiceAttrs.Category === 'B2B'
          ? [Math.round(options.shipping.fee / (1 + TaxRate))]
          : [options.shipping.fee]
        : []),
    ].join('|')
    const ItemPrice = [
      ...options.products.map((product) => {
        return invoiceAttrs.Category === 'B2B' ? Math.round(Number(product.price) / (1 + TaxRate)) : Number(product.price)
      }),
      ...options.discounts.map((discount) =>
        invoiceAttrs.Category === 'B2B' ? -Math.round(Number(discount.price) / (1 + TaxRate)) : -discount.price,
      ),
      ...(options.shipping?.method
        ? invoiceAttrs.Category === 'B2B'
          ? [Math.round(options.shipping.fee / (1 + TaxRate))]
          : [options.shipping.fee]
        : []),
    ].join('|')
    const ItemCount = [
      ...options.products.map((_) => 1),
      ...options.discounts.map((_) => 1),
      ...(options.shipping?.method ? [1] : []),
    ].join('|')

    const ItemName = [
      ...options.products.map((product) => product.name.substring(0, 25) + ` x${product.quantity}`),
      ...options.discounts.map((discount) => discount.name.substring(0, 30)),
      ...(options.shipping?.method ? [`運費 - ${options.shipping.method}`.substring(0, 30)] : []),
    ].join('|')
    const ItemUnit = Array(options.products.length + options.discounts.length)
      .fill('個')
      .concat(options.shipping?.method ? ['筆'] : [])
      .join('|')

    const ezpayCredentials = EzpayClient.formCredentials(appSecrets);
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
      MerchantOrderNo: paymentNo.replace(/-/g, '').substr(0, 20),
      ...invoiceAttrs,
      ...taxOptions,
    })
    return {
      Amt,
      invServiceResponse,
    };
  }
  
  public updateOrderAndPaymentLogInvoiceOptions(
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
          retry: orderLog.invoiceOptions['retry']
            ? parseInt(orderLog.invoiceOptions['retry']) + 1
            : 1,
        };
        orderLog.invoiceIssuedAt = invoiceIssueAt;
      }
      paymentLog.invoiceOptions = {
        ...paymentLog.invoiceOptions,
        ...invoiceOptions,
        retry: paymentLog.invoiceOptions['retry']
          ? parseInt(paymentLog.invoiceOptions['retry']) + 1
          : 1,
      };
      paymentLog.invoiceIssuedAt = invoiceIssueAt;

      await this.paymentInfra.save(paymentLog, manager);
      return await this.orderInfra.save(orderLogs, manager);
    };
    return entityManager ? cb(entityManager) : this.entityManager.transaction(cb);
  }

  public async insertInvoice(orderId: string, invoiceNumber: string, price: number, manager: EntityManager): Promise<void> {
    const invoice = new Invoice();

    invoice.orderId = orderId;
    invoice.no = invoiceNumber;
    invoice.price = price;

    await this.invoiceInfra.save(invoice, manager);
  }
}
