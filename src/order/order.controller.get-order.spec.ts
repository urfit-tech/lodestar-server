import { APIException } from '~/api.excetion';
import { OrderController } from './order.controller';

describe('OrderController getOrderById authorization', () => {
  const order = { id: 'ORDER1', appId: 'appA', memberId: 'buyer' };
  let getOrderById: jest.Mock;
  let controller: OrderController;

  beforeEach(() => {
    getOrderById = jest.fn().mockResolvedValue(order);
    controller = new OrderController({} as any, { getOrderById } as any, {} as any, {} as any);
  });

  const member = (overrides: Record<string, any>) =>
    ({ appId: 'appA', memberId: 'someone', role: 'general-member', permissions: [], ...overrides } as any);

  const expectNotFound = async (caller: any) => {
    const promise = controller.getOrderById(caller, 'ORDER1');
    await expect(promise).rejects.toBeInstanceOf(APIException);
    await expect(controller.getOrderById(caller, 'ORDER1')).rejects.toMatchObject({
      code: 'E_DB_GET_ORDER_NOT_FOUND',
    });
  };

  it('returns the order to its buyer', async () => {
    const result = await controller.getOrderById(member({ memberId: 'buyer' }), 'ORDER1');
    expect(result).toEqual({ code: 'SUCCESS', message: 'Get order successfully.', result: order });
  });

  it('hides the order from another general member of the same app', async () => {
    await expectNotFound(member({ memberId: 'other' }));
  });

  it('hides the order from the buyer id when the token belongs to another app', async () => {
    await expectNotFound(member({ appId: 'appB', memberId: 'buyer' }));
  });

  it.each(['SALES_RECORDS_NORMAL', 'SALES_RECORDS_ADMIN'])('allows same-app staff with %s', async permission => {
    const result = await controller.getOrderById(member({ permissions: [permission] }), 'ORDER1');
    expect(result.result).toBe(order);
  });

  it('allows the same app owner', async () => {
    const result = await controller.getOrderById(member({ role: 'app-owner' }), 'ORDER1');
    expect(result.result).toBe(order);
  });

  it('refuses staff and app owners of another app', async () => {
    await expectNotFound(member({ appId: 'appB', permissions: ['SALES_RECORDS_ADMIN'] }));
    await expectNotFound(member({ appId: 'appB', role: 'app-owner' }));
  });

  it('refuses unrelated permissions', async () => {
    await expectNotFound(member({ permissions: ['PROGRAM_ADMIN', 'BACKSTAGE_ENTER'] }));
  });

  describe('group-buying gift receiver (GroupBuyingReceivedPage)', () => {
    const giftOrder = {
      id: 'SUB1',
      appId: 'appA',
      memberId: 'buyer',
      transferredAt: null,
      invoiceOptions: { name: 'Buyer', phone: '0912345678', email: 'buyer@example.com' },
      shipping: { address: 'Taipei' },
      paymentModel: { type: 'credit' },
      message: 'note',
      options: { emailedNonSiteMemberEmail: { email: 'Friend@Example.com', timestamp: '2026-11-01T00:00:00Z' } },
    };

    beforeEach(() => getOrderById.mockResolvedValue(giftOrder));

    it('gives the invited member (email match, any case) only id and transferredAt', async () => {
      const result = await controller.getOrderById(
        member({ memberId: 'friend', email: ' friend@example.com' }),
        'SUB1',
      );
      expect(result).toEqual({
        code: 'SUCCESS',
        message: 'Get order successfully.',
        result: { id: 'SUB1', transferredAt: null },
      });
    });

    it('lets the invited member see that the gift was already transferred', async () => {
      const transferredAt = new Date('2026-11-02T00:00:00Z');
      getOrderById.mockResolvedValue({ ...giftOrder, memberId: 'someoneElse', transferredAt });
      const result = await controller.getOrderById(member({ memberId: 'friend', email: 'friend@example.com' }), 'SUB1');
      expect(result.result).toEqual({ id: 'SUB1', transferredAt });
    });

    it('gives the full order once the receiver owns it', async () => {
      getOrderById.mockResolvedValue({ ...giftOrder, memberId: 'friend', transferredAt: new Date() });
      const result = await controller.getOrderById(member({ memberId: 'friend', email: 'friend@example.com' }), 'SUB1');
      expect(result.result).toMatchObject({ id: 'SUB1', memberId: 'friend', invoiceOptions: giftOrder.invoiceOptions });
    });

    it('hides the order from a member with another email, no email, or another app', async () => {
      await expect(controller.getOrderById(member({ email: 'stranger@example.com' }), 'SUB1')).rejects.toMatchObject({
        code: 'E_DB_GET_ORDER_NOT_FOUND',
      });
      await expect(controller.getOrderById(member({}), 'SUB1')).rejects.toMatchObject({
        code: 'E_DB_GET_ORDER_NOT_FOUND',
      });
      await expect(
        controller.getOrderById(member({ appId: 'appB', email: 'friend@example.com' }), 'SUB1'),
      ).rejects.toMatchObject({ code: 'E_DB_GET_ORDER_NOT_FOUND' });
    });

    it('does not match orders without an invited email', async () => {
      getOrderById.mockResolvedValue({ ...giftOrder, options: { emailedNonSiteMemberEmail: { email: '' } } });
      await expect(controller.getOrderById(member({ email: '' }), 'SUB1')).rejects.toMatchObject({
        code: 'E_DB_GET_ORDER_NOT_FOUND',
      });
      getOrderById.mockResolvedValue({ ...giftOrder, options: null });
      await expect(controller.getOrderById(member({ email: 'friend@example.com' }), 'SUB1')).rejects.toMatchObject({
        code: 'E_DB_GET_ORDER_NOT_FOUND',
      });
    });
  });
});
