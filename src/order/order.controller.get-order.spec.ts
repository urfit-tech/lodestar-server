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
});
