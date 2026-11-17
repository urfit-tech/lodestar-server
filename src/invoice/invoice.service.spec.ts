import { Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { EzpayClient } from './ezpay_client';
import { InvoiceInfo } from './invoice.dto';
import { InvoiceService } from './invoice.service';

const sendToEzpay = async (items: Partial<InvoiceInfo>) => {
  const issue = jest.fn().mockResolvedValue({ Status: 'SUCCESS', Message: 'ok', Result: {} });
  const manager = { transaction: cb => cb(manager) } as unknown as EntityManager;
  const service = new InvoiceService(
    { log: jest.fn() } as unknown as Logger,
    { issue } as unknown as EzpayClient,
    manager,
    null,
    null,
    { getOneByOrderId: jest.fn().mockResolvedValue({ invoiceOptions: {} }) } as any,
    null,
    null,
  );
  jest.spyOn(service as any, 'checkInvoiceGatewayConfig').mockResolvedValue({ id: 'gateway', options: {} });
  jest.spyOn(service as any, 'updateOrderAndPaymentLogInvoiceOptionsByOrderId').mockResolvedValue([]);
  jest.spyOn(service as any, 'insertInvoiceLog').mockResolvedValue(undefined);
  jest.spyOn(service as any, 'insertInvoice').mockResolvedValue(undefined);
  jest.spyOn(EzpayClient, 'formCredentials').mockReturnValue({} as any);

  await service.issueInvoiceDirectly(
    'app-id',
    'order-id',
    'gateway-id',
    { MerchantOrderNo: 'order-no', ...items } as InvoiceInfo,
    manager,
  );

  return issue.mock.calls[0][1] as InvoiceInfo;
};

describe('InvoiceService.issueInvoiceDirectly line items', () => {
  it('keeps the quantity and total of a decimal unit price, with a tax type for every row', async () => {
    const sent = await sendToEzpay({
      ItemName: '中文註冊費|中文學費|NPC教材',
      ItemCount: '1|9|1',
      ItemPrice: '800|533.33|900',
      ItemAmt: '800|4799.97|900',
      ItemUnit: '項|項|項',
      ItemTaxType: '3|3|1',
    });

    expect(sent).toMatchObject({
      ItemName: '中文註冊費|中文學費|中文學費|NPC教材',
      ItemCount: '1|6|3|1',
      ItemPrice: '800|533|534|900',
      ItemAmt: '800|3198|1602|900',
      ItemUnit: '項|項|項|項',
      ItemTaxType: '3|3|3|1',
    });
  });

  it('sends a fractional quantity as one row of the rounded line total', async () => {
    const sent = await sendToEzpay({
      ItemName: '中文註冊費|教材|中文學費',
      ItemCount: '1|1|28.5',
      ItemPrice: '800|360|1000',
      ItemAmt: '800|360|28500',
      ItemUnit: '項|項|項',
      ItemTaxType: '3|1|3',
    });

    expect(sent).toMatchObject({
      ItemCount: '1|1|1',
      ItemPrice: '800|360|28500',
      ItemAmt: '800|360|28500',
      ItemTaxType: '3|1|3',
    });
  });

  it('does not change an invoice that only has whole numbers', async () => {
    const items = {
      ItemName: 'A|B',
      ItemCount: '2|1',
      ItemPrice: '1000|500',
      ItemAmt: '2000|500',
      ItemUnit: '件|件',
    };

    const sent = await sendToEzpay(items);

    expect(sent).toMatchObject(items);
    expect(sent).not.toHaveProperty('ItemTaxType');
  });

  it('does not add a tax type to a single-tax invoice with a decimal line', async () => {
    const sent = await sendToEzpay({
      ItemName: '中文學費',
      ItemCount: '23.5',
      ItemPrice: '1020',
      ItemAmt: '23970',
      ItemUnit: '項',
    });

    expect(sent).toMatchObject({ ItemCount: '1', ItemPrice: '23970', ItemAmt: '23970' });
    expect(sent).not.toHaveProperty('ItemTaxType');
  });

  it('keeps blank tax types in step with the rows sent', async () => {
    const sent = await sendToEzpay({
      ItemName: 'A|B',
      ItemCount: '10|23',
      ItemPrice: '3240|2993.48',
      ItemAmt: '32400|68850.04',
      ItemUnit: '項|項',
      ItemTaxType: '|',
    });

    expect(sent).toMatchObject({
      ItemCount: '10|12|11',
      ItemPrice: '3240|2993|2994',
      ItemAmt: '32400|35916|32934',
      ItemTaxType: '||',
    });
  });
});
