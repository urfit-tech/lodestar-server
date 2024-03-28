import { IsNotEmpty, IsString } from 'class-validator';
export class OrderLogCsvHeaderMapping {
  @IsString()
  @IsNotEmpty()
  orderLogId: string;

  @IsString()
  @IsNotEmpty()
  paymentLogNo: string;

  @IsString()
  @IsNotEmpty()
  orderLogStatus: string;

  @IsString()
  @IsNotEmpty()
  paymentLogGateway: string;

  @IsString()
  @IsNotEmpty()
  paymentLogDetails: string;

  @IsString()
  @IsNotEmpty()
  orderCountry: string;

  @IsString()
  @IsNotEmpty()
  orderLogCreatedAt: string;

  @IsString()
  @IsNotEmpty()
  paymentLogPaidAt: string;

  @IsString()
  @IsNotEmpty()
  memberName: string;

  @IsString()
  @IsNotEmpty()
  memberEmail: string;

  @IsString()
  @IsNotEmpty()
  orderProductName: string;

  @IsString()
  @IsNotEmpty()
  orderDiscountName: string;

  @IsString()
  @IsNotEmpty()
  orderProductCount: string;

  @IsString()
  @IsNotEmpty()
  orderProductTotalPrice: string;

  @IsString()
  @IsNotEmpty()
  shippingFee: string;

  @IsString()
  @IsNotEmpty()
  orderDiscountTotalPrice: string;

  @IsString()
  @IsNotEmpty()
  orderLogTotalPrice: string;

  @IsString()
  @IsNotEmpty()
  sharingCode: string;

  @IsString()
  @IsNotEmpty()
  sharingNote: string;

  @IsString()
  @IsNotEmpty()
  referrer: string;

  @IsString()
  @IsNotEmpty()
  orderLogExecutor: string;

  @IsString()
  @IsNotEmpty()
  gift: string;

  @IsString()
  @IsNotEmpty()
  send: string;

  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @IsString()
  @IsNotEmpty()
  recipientAddress: string;

  @IsString()
  @IsNotEmpty()
  invoiceName: string;

  @IsString()
  @IsNotEmpty()
  invoiceEmail: string;

  @IsString()
  @IsNotEmpty()
  invoicePhone: string;

  @IsString()
  @IsNotEmpty()
  invoiceTarget: string;

  @IsString()
  @IsNotEmpty()
  invoiceCarrier: string;

  @IsString()
  @IsNotEmpty()
  invoiceDonationCode: string;

  @IsString()
  @IsNotEmpty()
  invoiceUniformNumber: string;

  @IsString()
  @IsNotEmpty()
  invoiceUniformTitle: string;

  @IsString()
  @IsNotEmpty()
  invoiceAddress: string;

  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @IsString()
  @IsNotEmpty()
  invoiceIssuedAt: string;

  @IsString()
  @IsNotEmpty()
  invoiceStatus: string;

  @IsString()
  @IsNotEmpty()
  specification: string;

  public async createHeader() {
    this.orderLogId = '訂單編號';
    this.paymentLogNo = '交易編號';
    this.orderLogStatus = '訂單狀態';
    this.paymentLogGateway = '交易渠道';
    this.paymentLogDetails = '付款方式';
    this.orderCountry = '下單國家';
    this.orderLogCreatedAt = '訂單建立時間';
    this.paymentLogPaidAt = '付款時間';
    this.memberName = '會員姓名';
    this.memberEmail = '會員信箱';
    this.orderProductName = '項目名稱';
    this.orderDiscountName = '折扣名稱';
    this.orderProductCount = '項目總數';
    this.orderProductTotalPrice = '項目總額';
    this.shippingFee = '運費';
    this.orderDiscountTotalPrice = '折扣總額';
    this.orderLogTotalPrice = '訂單總額';
    this.sharingCode = '推廣網址';
    this.sharingNote = '推廣備註';
    this.referrer = '推薦人';
    this.orderLogExecutor = '承辦人與分潤';
    this.gift = '贈品項目';
    this.send = '寄送';
    this.recipientName = '收件人';
    this.recipientPhone = '收件電話';
    this.recipientAddress = '收件地址';
    this.invoiceName = '發票姓名';
    this.invoiceEmail = '發票信箱';
    this.invoicePhone = '發票電話';
    this.invoiceTarget = '發票對象';
    this.invoiceDonationCode = '發票捐贈碼';
    this.invoiceCarrier = '發票載具';
    this.invoiceUniformNumber = '發票統編';
    this.invoiceUniformTitle = '發票抬頭';
    this.invoiceAddress = '發票地址';
    this.invoiceId = '發票編號';
    this.invoiceIssuedAt = '發票開立時間';
    this.invoiceStatus = '發票狀態';
    this.specification = '商品備註';

    return this;
  }

  public async serializeToRawRow() {
    return {
      ['訂單編號']: 'orderLogId',
      ['交易編號']: 'paymentLogNo',
      ['訂單狀態']: 'orderLogStatus',
      ['交易渠道']: 'paymentLogGateway',
      ['付款方式']: 'paymentLogDetails',
      ['下單國家']: 'orderCountry',
      ['訂單建立時間']: 'orderLogCreatedAt',
      ['付款時間']: 'paymentLogPaidAt',
      ['會員姓名']: 'memberName',
      ['會員信箱']: 'memberEmail',
      ['項目名稱']: 'orderProductName',
      ['折扣名稱']: 'orderDiscountName',
      ['項目總數']: 'orderProductCount',
      ['項目總額']: 'orderProductTotalPrice',
      ['運費']: 'shippingFee',
      ['折扣總額']: 'orderDiscountTotalPrice',
      ['訂單總額']: 'orderLogTotalPrice',
      ['推廣網址']: 'sharingCode',
      ['推廣備註']: 'sharingNote',
      ['推薦人']: 'referrer',
      ['承辦人與分潤']: 'orderLogExecutor',
      ['贈品項目']: 'gift',
      ['寄送']: 'send',
      ['收件人']: 'recipientName',
      ['收件電話']: 'recipientPhone',
      ['收件地址']: 'recipientAddress',
      ['發票姓名']: 'invoiceName',
      ['發票信箱']: 'invoiceEmail',
      ['發票電話']: 'invoicePhone',
      ['發票對象']: 'invoiceTarget',
      ['發票捐贈碼']: 'invoiceDonationCode',
      ['發票載具']: 'invoiceCarrier',
      ['發票統編']: 'invoiceUniformNumber',
      ['發票抬頭']: 'invoiceUniformTitle',
      ['發票地址']: 'invoiceAddress',
      ['發票編號']: 'invoiceId',
      ['發票開立時間']: 'invoiceIssuedAt',
      ['發票狀態']: 'invoiceStatus',
      ['商品備註']: 'specification',
    };
  }
}

export class OrderProductCsvHeaderMapping {
  @IsString()
  @IsNotEmpty()
  orderLogId: string;

  @IsString()
  @IsNotEmpty()
  orderCountry: string;

  @IsString()
  @IsNotEmpty()
  orderLogCreatedAt: string;

  @IsString()
  @IsNotEmpty()
  paymentLogPaidAt: string;

  @IsString()
  @IsNotEmpty()
  productOwner: string;

  @IsString()
  @IsNotEmpty()
  productType: string;

  @IsString()
  @IsNotEmpty()
  orderProductId: string;

  @IsString()
  @IsNotEmpty()
  orderProductName: string;

  @IsString()
  @IsNotEmpty()
  productEndedAt: string;

  @IsString()
  @IsNotEmpty()
  productQuantity: string;

  @IsString()
  @IsNotEmpty()
  productPrice: string;

  @IsString()
  @IsNotEmpty()
  sharingCode: string;

  @IsString()
  @IsNotEmpty()
  referrer: string;

  public async createHeader() {
    this.orderLogId = '訂單編號';
    this.orderCountry = '下單國家';
    this.orderLogCreatedAt = '訂單建立時間';
    this.paymentLogPaidAt = '付款時間';
    this.productOwner = '創作者';
    this.productType = '項目類別';
    this.orderProductId = '項目編號';
    this.orderProductName = '項目名稱';
    this.productEndedAt = '項目到期時間';
    this.productQuantity = '項目數量';
    this.productPrice = '項目金額';
    this.sharingCode = '推廣網址';
    this.referrer = '推薦人';

    return this;
  }

  public async serializeToRawRow() {
    return {
      ['訂單編號']: 'orderLogId',
      ['下單國家']: 'orderCountry',
      ['訂單建立時間']: 'orderLogCreatedAt',
      ['付款時間']: 'paymentLogPaidAt',
      ['創作者']: 'productOwner',
      ['項目類別']: 'productType',
      ['項目編號']: 'orderProductId',
      ['項目名稱']: 'orderProductName',
      ['項目到期時間']: 'productEndedAt',
      ['項目數量']: 'productQuantity',
      ['項目金額']: 'productPrice',
      ['推廣網址']: 'sharingCode',
      ['推薦人']: 'referrer',
    };
  }
}

export class OrderDiscountCsvHeaderMapping {
  @IsString()
  @IsNotEmpty()
  orderLogId: string;

  @IsString()
  @IsNotEmpty()
  orderCountry: string;

  @IsString()
  @IsNotEmpty()
  orderDiscountId: string;

  @IsString()
  @IsNotEmpty()
  orderDiscountName: string;

  @IsString()
  @IsNotEmpty()
  orderDiscountPrice: string;

  public async createHeader() {
    this.orderLogId = '訂單編號';
    this.orderCountry = '下單國家';
    this.orderDiscountId = '折扣編號';
    this.orderDiscountName = '折扣名稱';
    this.orderDiscountPrice = '折扣金額';

    return this;
  }

  public async serializeToRawRow() {
    return {
      ['訂單編號']: 'orderLogId',
      ['下單國家']: 'orderCountry',
      ['折扣編號']: 'orderDiscountId',
      ['折扣名稱']: 'orderDiscountName',
      ['折扣金額']: 'orderDiscountPrice',
    };
  }
}
