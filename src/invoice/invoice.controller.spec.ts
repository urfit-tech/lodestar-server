import { InvoiceController } from './invoice.controller';
import { InvoiceExceedsOrderAmountError } from './invoice.error';

const dto = {
  appId: 'app-1',
  orderId: 'ORDER1',
  invoiceGatewayId: 'gateway-1',
  invoiceInfo: { TotalAmt: 100 } as any,
};
const member = { memberId: 'member-1' } as any;

const build = (issueInvoiceDirectly: jest.Mock) => {
  const entityManager = {} as any;
  const controller = new InvoiceController({ issueInvoiceDirectly } as any, entityManager);
  return { controller, entityManager };
};

describe('InvoiceController.issueInvoice', () => {
  it('asks the service to hold manual invoices to the order amount', async () => {
    const issueInvoiceDirectly = jest.fn(async () => ({ Status: 'SUCCESS' }));
    const { controller, entityManager } = build(issueInvoiceDirectly);

    await expect(controller.issueInvoice(member, dto)).resolves.toEqual({
      code: 'SUCCESS',
      message: 'issue invoice successfully',
      result: { Status: 'SUCCESS' },
    });
    expect(issueInvoiceDirectly).toHaveBeenCalledWith('app-1', 'ORDER1', 'gateway-1', dto.invoiceInfo, entityManager, {
      executorMemberId: 'member-1',
      limitToOrderAmount: true,
    });
  });

  it('returns a refusal in the shape the admin shows as a failed issue', async () => {
    const issueInvoiceDirectly = jest.fn(async () => {
      throw new InvoiceExceedsOrderAmountError('too much');
    });
    const { controller } = build(issueInvoiceDirectly);

    await expect(controller.issueInvoice(member, dto)).resolves.toEqual({
      code: 'E_INVOICE_EXCEEDS_ORDER_AMOUNT',
      message: 'too much',
      result: { Status: 'E_INVOICE_EXCEEDS_ORDER_AMOUNT', Message: 'too much' },
    });
  });

  it('rethrows other errors', async () => {
    const issueInvoiceDirectly = jest.fn(async () => {
      throw new Error('ezpay down');
    });
    const { controller } = build(issueInvoiceDirectly);

    await expect(controller.issueInvoice(member, dto)).rejects.toThrow('ezpay down');
  });
});
