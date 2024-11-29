import { EntityManager, Repository } from 'typeorm';
import { CoinInfrastructure } from './coin.infra';
import { Member } from '~/member/entity/member.entity';
import { CoinLogAuditLog } from './entity/coin_log_audit_log.entity';

describe('CoinInfrastructure', () => {
  let coinInfrastructure: CoinInfrastructure;
  let mockEntityManager: EntityManager;
  let coinLogAuditLogRepo: Repository<CoinLogAuditLog>;

  beforeEach(() => {
    coinInfrastructure = new CoinInfrastructure();

    mockEntityManager = {
      getRepository: jest.fn(),
    } as unknown as EntityManager;

    coinLogAuditLogRepo = {
      save: jest.fn(),
    } as unknown as Repository<CoinLogAuditLog>;

    (mockEntityManager.getRepository as jest.Mock).mockReturnValue(coinLogAuditLogRepo);
  });

  it('should insert an audit log for each invoker', async () => {
    const invokers: Member[] = [{ id: 'invoker1' } as Member, { id: 'invoker2' } as Member];

    const target = 'test-data.csv';
    const action = 'upload';

    (coinLogAuditLogRepo.save as jest.Mock).mockResolvedValue({});

    const result = await coinInfrastructure.insertCoinLogAuditLog(invokers, target, action, mockEntityManager);

    expect(mockEntityManager.getRepository).toHaveBeenCalledWith(CoinLogAuditLog);

    expect(coinLogAuditLogRepo.save).toHaveBeenCalledTimes(invokers.length);

    invokers.forEach((invoker, index) => {
      expect(coinLogAuditLogRepo.save).toHaveBeenNthCalledWith(index + 1, {
        memberId: invoker.id,
        target,
        action,
      });
    });

    expect(result).toEqual([
      { status: 'fulfilled', value: {} },
      { status: 'fulfilled', value: {} },
    ]);
  });

  it('should handle a rejection when saving an audit log', async () => {
    const invokers: Member[] = [{ id: 'invoker1' } as Member, { id: 'invoker2' } as Member];
    const target = 'test-data.csv';
    const action = 'upload';

    (coinLogAuditLogRepo.save as jest.Mock).mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('Save failed'));

    const result = await coinInfrastructure.insertCoinLogAuditLog(invokers, target, action, mockEntityManager);

    expect(coinLogAuditLogRepo.save).toHaveBeenCalledTimes(invokers.length);

    expect(result).toEqual([
      { status: 'fulfilled', value: {} },
      { status: 'rejected', reason: new Error('Save failed') },
    ]);
  });
});
