import dayjs from 'dayjs';
import { EntityManager, Equal } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { Invoice } from '~/invoice/invoice.entity';
import { OrderLog } from '~/order/entity/order_log.entity';
import { PaymentLog } from '~/payment/payment_log.entity';

import { EzpayClient } from './ezpay_client';

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
    @InjectEntityManager('phdb') private readonly entityManager: EntityManager,
  ) {}

  async issueInvoice(
    appSecrets: Record<string, string>,
    paymentNo: string,
    amount: number,
    options: InvoiceOptions,
    entityManager?: EntityManager,
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
    const invoiceNumber = invServiceResponse.Result?.['InvoiceNumber']

    const orderLogs = await this.updateOrderAndPaymentLogInvoiceOptions(
      paymentNo,
      {
        status: invServiceResponse.Status,
        invoiceTransNo: invServiceResponse.Result?.['InvoiceTransNo'],
        invoiceNumber: invoiceNumber,
      },
      invServiceResponse.Status === 'SUCCESS' ? dayjs().toDate() : undefined,
      entityManager,
    );
    if (invServiceResponse.Status !== 'SUCCESS') {
      throw new Error(invServiceResponse.Message)
    } else {
      const orderId = orderLogs[0].id;
      if (orderId && invoiceNumber) {
        await this.insertInvoice(orderId, invoiceNumber, Amt, entityManager);
      }
    }
  }
  
  private updateOrderAndPaymentLogInvoiceOptions(
    paymentNo: string,
    invoiceOptions: any,
    invoiceIssueAt: Date,
    entityManager?: EntityManager,
  ) {
    const cb = async (manager: EntityManager) => {
      const orderLogRepo = manager.getRepository(OrderLog);
      const paymentLogRepo = manager.getRepository(PaymentLog);
      const orderLogs = await orderLogRepo.find({
        where: { paymentLogs: { no: Equal(paymentNo) } },
      });
      const paymentLog = await paymentLogRepo.findOne({
        where: { no: Equal(paymentNo) },
      });

      for (const orderLog of orderLogs) {
        orderLog.invoiceOptions = {
          ...orderLog.invoiceOptions,
          ...invoiceOptions,
        };
        orderLog.invoiceIssuedAt = invoiceIssueAt;
      }
      paymentLog.invoiceOptions = {
        ...paymentLog.invoiceOptions,
        ...invoiceOptions,
      };
      paymentLog.invoiceIssuedAt = invoiceIssueAt;

      await paymentLogRepo.save(paymentLog);
      return await orderLogRepo.save(orderLogs);
    };
    return entityManager ? cb(entityManager) : this.entityManager.transaction(cb);
  }

  private insertInvoice(orderId: string, invoiceNumber: string, price: number, entityManager?: EntityManager) {
    const cb = async (manager: EntityManager) => {
      const invoiceRepo = manager.getRepository(Invoice);
      
      const invoice = new Invoice();
      invoice.orderId = orderId;
      invoice.no = invoiceNumber;
      invoice.price = price;

      return invoiceRepo.save(invoice);
    };

    return entityManager ? cb(entityManager) : this.entityManager.transaction(cb);
  }
}
