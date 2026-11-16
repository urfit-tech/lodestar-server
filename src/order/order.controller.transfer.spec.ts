import { OrderController } from './order.controller';

describe('OrderController transferOrder (group-buying claim)', () => {
  const transferToken = { appId: 'appA', email: 'friend@example.com', orderLogId: 'SUB1' };
  let authService: { verify: jest.Mock };
  let orderService: { getOrderById: jest.Mock; transferReceivedOrder: jest.Mock };
  let controller: OrderController;
  const entityManager = {};

  beforeEach(() => {
    authService = { verify: jest.fn().mockReturnValue(transferToken) };
    orderService = {
      getOrderById: jest.fn().mockResolvedValue({ id: 'SUB1', appId: 'appA', memberId: 'buyer', transferredAt: null }),
      transferReceivedOrder: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    controller = new OrderController(authService as any, orderService as any, {} as any, entityManager as any);
  });

  const member = (overrides: Record<string, any> = {}) =>
    ({ appId: 'appA', memberId: 'friend', role: 'general-member', permissions: [], ...overrides } as any);

  it('transfers an untransferred gift order to the caller', async () => {
    const result = await controller.transferOrder(member(), { token: 'jwt', memberId: 'friend' });
    expect(result.code).toBe('SUCCESS');
    expect(orderService.transferReceivedOrder).toHaveBeenCalledWith(
      { memberId: 'friend', orderId: 'SUB1' },
      entityManager,
      'friend',
    );
  });

  it('ignores a body memberId other than the caller', async () => {
    await controller.transferOrder(member(), { token: 'jwt', memberId: 'someoneElse' });
    expect(orderService.transferReceivedOrder.mock.calls[0][0]).toEqual({ memberId: 'friend', orderId: 'SUB1' });
  });

  it('refuses an order that was already transferred', async () => {
    orderService.getOrderById.mockResolvedValue({
      id: 'SUB1',
      appId: 'appA',
      memberId: 'firstReceiver',
      transferredAt: new Date(),
    });
    await expect(controller.transferOrder(member(), { token: 'jwt', memberId: 'friend' })).rejects.toMatchObject({
      code: 'E_ORDER_ALREADY_TRANSFERRED',
    });
    expect(orderService.transferReceivedOrder).not.toHaveBeenCalled();
  });

  it('refuses an order of another app', async () => {
    await expect(
      controller.transferOrder(member({ appId: 'appB' }), { token: 'jwt', memberId: 'friend' }),
    ).rejects.toMatchObject({ code: 'E_DB_GET_ORDER_NOT_FOUND' });
    expect(orderService.transferReceivedOrder).not.toHaveBeenCalled();
  });

  it('refuses an invalid token or one without orderLogId', async () => {
    authService.verify.mockImplementationOnce(() => {
      throw new Error('bad signature');
    });
    await expect(controller.transferOrder(member(), { token: 'bad', memberId: 'friend' })).rejects.toMatchObject({
      code: 'E_TOKEN_INVALID',
    });
    authService.verify.mockReturnValueOnce({ appId: 'appA', sub: 'friend' });
    await expect(controller.transferOrder(member(), { token: 'login-jwt', memberId: 'friend' })).rejects.toMatchObject({
      code: 'E_TOKEN_INVALID',
    });
    expect(orderService.getOrderById).not.toHaveBeenCalled();
    expect(orderService.transferReceivedOrder).not.toHaveBeenCalled();
  });
});
