import { IsString, IsNotEmpty } from 'class-validator';

import { OrderLogCsvHeaderMapping } from './csvHeaderMapping';

/**
 * Formats represents raw rows inside csv file for order import.
 */
export class CsvRawOrderLog {
  @IsString()
  @IsNotEmpty()
  orderLogId: string;

  @IsString()
  paymentLogNo: string;

  @IsString()
  @IsNotEmpty()
  orderLogStatus: string;

  @IsString()
  paymentLogGateway: string;

  @IsString()
  paymentLogDetails: string;

  @IsString()
  orderCountry: string;

  @IsString()
  @IsNotEmpty()
  orderLogCreatedAt: string;

  @IsString()
  paymentLogPaidAt: string;

  @IsString()
  @IsNotEmpty()
  memberName: string;

  @IsString()
  @IsNotEmpty()
  memberEmail: string;

  @IsString()
  orderProductName: string;

  @IsString()
  orderDiscountName: string;

  @IsString()
  orderProductCount: number;

  @IsString()
  orderProductTotalPrice: number;

  @IsString()
  shippingFee: number;

  @IsString()
  orderDiscountTotalPrice: number;

  @IsString()
  orderLogTotalPrice: number;

  @IsString()
  sharingCode: string;

  @IsString()
  sharingNote: string;

  @IsString()
  referrer: string;

  @IsString()
  orderLogExecutor: string;

  @IsString()
  gift: string;

  @IsString()
  send: string;

  @IsString()
  recipientName: string;

  @IsString()
  recipientPhone: string;

  @IsString()
  recipientAddress: string;

  @IsString()
  invoiceName: string;

  @IsString()
  invoiceEmail: string;

  @IsString()
  invoicePhone: string;

  @IsString()
  invoiceTarget: string;

  @IsString()
  invoiceCarrier: string;

  @IsString()
  invoiceDonationCode: string;

  @IsString()
  invoiceUniformNumber: string;

  @IsString()
  invoiceUniformTitle: string;

  @IsString()
  invoiceAddress: string;

  @IsString()
  invoiceId: string;

  @IsString()
  invoiceIssuedAt: string;

  @IsString()
  invoiceStatus: string;

  public serializeToCsvRawRow(header: OrderLogCsvHeaderMapping): Record<string, string | number | string> {
    return {
      [header.orderLogId]: this.orderLogId,
      [header.paymentLogNo]: this.paymentLogNo,
      [header.orderLogStatus]: this.orderLogStatus,
      [header.paymentLogGateway]: this.paymentLogGateway,
      [header.paymentLogDetails]: this.paymentLogDetails,
      [header.orderCountry]: this.orderCountry,
      [header.orderLogCreatedAt]: this.orderLogCreatedAt,
      [header.paymentLogPaidAt]: this.paymentLogPaidAt,
      [header.memberName]: this.memberName,
      [header.memberEmail]: this.memberEmail,
      [header.orderProductName]: this.orderProductName,
      [header.orderDiscountName]: this.orderDiscountName,
      [header.orderProductCount]: this.orderProductCount,
      [header.orderProductTotalPrice]: this.orderProductTotalPrice,
      [header.shippingFee]: this.shippingFee,
      [header.orderDiscountTotalPrice]: this.orderDiscountTotalPrice,
      [header.orderLogTotalPrice]: this.orderLogTotalPrice,
      [header.sharingCode]: this.sharingCode,
      [header.sharingNote]: this.sharingNote,
      [header.referrer]: this.referrer,
      [header.orderLogExecutor]: this.orderLogExecutor,
      [header.gift]: this.gift,
      [header.send]: this.send,
      [header.recipientName]: this.recipientName,
      [header.recipientPhone]: this.recipientPhone,
      [header.recipientAddress]: this.recipientAddress,
      [header.invoiceName]: this.invoiceName,
      [header.invoiceEmail]: this.invoiceEmail,
      [header.invoicePhone]: this.invoicePhone,
      [header.invoiceTarget]: this.invoiceTarget,
      [header.invoiceCarrier]: this.invoiceCarrier,
      [header.invoiceDonationCode]: this.invoiceDonationCode,
      [header.invoiceUniformTitle]: this.invoiceUniformTitle,
      [header.invoiceUniformNumber]: this.invoiceUniformNumber,
      [header.invoiceAddress]: this.invoiceAddress,
      [header.invoiceId]: this.invoiceId,
      [header.invoiceIssuedAt]: this.invoiceIssuedAt,
      [header.invoiceStatus]: this.invoiceStatus,
    };
  }
}
