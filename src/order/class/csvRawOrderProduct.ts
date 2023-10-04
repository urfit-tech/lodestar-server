import { IsString, IsNotEmpty } from 'class-validator';

import { OrderProductCsvHeaderMapping } from './csvHeaderMapping';

/**
 * Formats represents raw rows inside csv file for order product import.
 */

export class CsvRawOrderProduct {
  @IsString()
  @IsNotEmpty()
  orderLogId: string;

  @IsString()
  orderCountry: string;

  @IsString()
  @IsNotEmpty()
  orderLogCreatedAt: string;

  @IsString()
  paymentLogPaidAt: string;

  @IsString()
  @IsNotEmpty()
  productOwner: string;

  @IsString()
  @IsNotEmpty()
  productType: string;

  @IsString()
  orderProductId: string;

  @IsString()
  orderProductName: string;

  @IsString()
  productEndedAt: string;

  @IsString()
  productQuantity: number;

  @IsString()
  productPrice: number;

  @IsString()
  sharingCode: string;

  @IsString()
  referrer: string;

  public serializeToCsvRawRow(header: OrderProductCsvHeaderMapping): Record<string, string | number | string> {
    return {
      [header.orderLogId]: this.orderLogId,
      [header.orderCountry]: this.orderCountry,
      [header.orderLogCreatedAt]: this.orderLogCreatedAt,
      [header.paymentLogPaidAt]: this.paymentLogPaidAt,
      [header.productOwner]: this.productOwner,
      [header.productType]: this.productType,
      [header.orderProductId]: this.orderProductId,
      [header.orderProductName]: this.orderProductName,
      [header.productEndedAt]: this.productEndedAt,
      [header.productQuantity]: this.productQuantity,
      [header.productPrice]: this.productPrice,
      [header.sharingCode]: this.sharingCode,
      [header.referrer]: this.referrer,
    };
  }
}
