import { ValidationError } from 'class-validator';
import {
  OrderDiscountCsvHeaderMapping,
  OrderLogCsvHeaderMapping,
  OrderProductCsvHeaderMapping,
} from './csvHeaderMapping';

describe('Class OrderLogCsvHeaderMapping', () => {
  // TODO: deserializeToRawRow for orderLogCsvHeaderMapping
  describe('Method serializeToRawRow', () => {
    it('Should return csv header ', async () => {
      const csvHeaderMapping = new OrderLogCsvHeaderMapping();
      const header = await csvHeaderMapping.serializeToRawRow();
      expect({
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
      }).toEqual(header);
    });
  });
});

describe('Class OrderProductCsvHeaderMapping', () => {
  // TODO: deserializeToRawRow for OrderProductCsvHeaderMapping
  describe('Method serializeToRawRow', () => {
    it('Should return csv header ', async () => {
      const csvHeaderMapping = new OrderProductCsvHeaderMapping();
      const header = await csvHeaderMapping.serializeToRawRow();
      expect({
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
      }).toEqual(header);
    });
  });
});

describe('Class OrderDiscountCsvHeaderMapping', () => {
  describe('Method serializeToRawRow', () => {
    // TODO: deserializeToRawRow for OrderDiscountCsvHeaderMapping
    it('Should return csv header ', async () => {
      const csvHeaderMapping = new OrderDiscountCsvHeaderMapping();
      const header = await csvHeaderMapping.serializeToRawRow();
      expect({
        ['訂單編號']: 'orderLogId',
        ['下單國家']: 'orderCountry',
        ['折扣編號']: 'orderDiscountId',
        ['折扣名稱']: 'orderDiscountName',
        ['折扣金額']: 'orderDiscountPrice',
      }).toEqual(header);
    });
  });
});
