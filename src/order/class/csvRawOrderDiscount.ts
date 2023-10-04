import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

import { OrderDiscountCsvHeaderMapping } from './csvHeaderMapping';

/**
 * Formats represents raw rows inside csv file for order product import.
 */

export class CsvRawOrderDiscount {
  @IsString()
  @IsNotEmpty()
  orderLogId: string;

  @IsString()
  orderCountry: string;

  @IsString()
  @IsNotEmpty()
  orderDiscountId: string;

  @IsString()
  orderDiscountName: string;

  @IsNumber()
  @IsNotEmpty()
  orderDiscountPrice: number;

  public serializeToCsvRawRow(header: OrderDiscountCsvHeaderMapping): Record<string, string | number | string> {
    return {
      [header.orderLogId]: this.orderLogId,
      [header.orderCountry]: this.orderCountry,
      [header.orderDiscountId]: this.orderDiscountId,
      [header.orderDiscountName]: this.orderDiscountName,
      [header.orderDiscountPrice]: this.orderDiscountPrice,
    };
  }
}
