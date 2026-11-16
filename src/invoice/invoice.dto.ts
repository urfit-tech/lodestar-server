import { IsObject, IsString } from 'class-validator';

export type InvoiceInfo = {
  MerchantOrderNo: string;
  BuyerName: string;
  BuyerUBN?: string;
  BuyerAddress?: string;
  BuyerPhone?: string;
  BuyerEmail?: string;
  Category: string;
  TaxType: string;
  TaxRate: number;
  Amt: number;
  TaxAmt: string;
  TotalAmt: number;
  LoveCode?: string;
  PrintFlag: string;
  ItemName: string;
  ItemCount: string;
  ItemUnit: string;
  ItemPrice: string;
  ItemAmt: string;
  ItemTaxType?: string;
  Comment?: string;
  AmtFree?: number;
  AmtZero?: number;
  CustomsClearance?: string;
  AmtSales?: number;
};
export class IssueInvoiceBodyDTO {
  @IsString()
  invoiceGatewayId: string;

  @IsObject()
  invoiceInfo: InvoiceInfo;

  @IsString()
  orderId: string;
}

export class SearchInvoiceBodyDTO {
  @IsString()
  invoiceGatewayId: string;

  @IsString()
  invoiceNumber: string;

  @IsString()
  invoiceRandomNumber: string;
}
export class RevokeInvoiceBodyDTO {
  @IsString()
  invoiceGatewayId: string;

  @IsString()
  invoiceNumber: string;

  @IsString()
  invalidReason: string;
}
