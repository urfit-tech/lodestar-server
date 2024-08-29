import { IsObject, IsString } from 'class-validator';

export class IssueInvoiceBodyDTO {
  @IsString()
  appId: string;

  @IsString()
  invoiceGatewayId: string;

  @IsObject()
  invoiceInfo: {
    MerchantOrderNo: string;
    BuyerName: string;
    BuyerUBN?: string;
    BuyerAddress?: string;
    BuyerPhone?: string;
    BuyerEmail?: string;
    Category: string;
    TaxType: string;
    TaxRate: string;
    Amt: string;
    TaxAmt: string;
    TotalAmt: string;
    LoveCode?: string;
    PrintFlag: string;
    ItemName: string;
    ItemCount: string;
    ItemUnit: string;
    ItemPrice: string;
    ItemAmt: string;
    ItemTaxType?: string;
    Comment?: string;
  };
}

export class SearchInvoiceBodyDTO {
  @IsString()
  invoiceGatewayId: string;

  @IsString()
  invoiceNumber: string;

  @IsString()
  appId: string;

  @IsString()
  invoiceRandomNumber: string;
}
export class RevokeInvoiceBodyDTO {
  @IsString()
  invoiceGatewayId: string;

  @IsString()
  invoiceNumber: string;

  @IsString()
  appId: string;

  @IsString()
  invalidReason: string;
}
