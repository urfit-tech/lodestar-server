import { OrderController } from './order.controller';
import { EXPORT_JOB_TIMEOUT_MS } from './order.export.constants';

describe('OrderController export job options', () => {
  it('adds export jobs with a timeout and removeOnComplete/removeOnFail', async () => {
    const add = jest.fn().mockResolvedValue(undefined);
    const controller = new OrderController(
      {} as any, // authService
      {} as any, // orderService
      { add } as any, // exportQueue
      {} as any, // entityManager
    );
    const member = { appId: 'app1', memberId: 'm1' } as any;
    await controller.exportOrderLogs(member, { exportMime: 'xlsx' } as any);
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ appId: 'app1', category: 'orderLog' }),
      expect.objectContaining({ removeOnComplete: true, removeOnFail: true, timeout: EXPORT_JOB_TIMEOUT_MS }),
    );
  });
});
