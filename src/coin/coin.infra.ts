import { EntityManager } from 'typeorm';
import { Member } from '~/member/entity/member.entity';
import { CoinLogAuditLog } from './entity/coin_log_audit_log.entity';

export class CoinInfrastructure {
  async insertCoinLogAuditLog(invokers: Array<Member>, target: string, action: 'upload', manager: EntityManager) {
    const coinLogAuditLogRepo = manager.getRepository(CoinLogAuditLog);

    return Promise.allSettled(
      invokers.map(invoker => {
        const toInsert = new CoinLogAuditLog();
        toInsert.memberId = invoker.id;
        toInsert.target = target;
        toInsert.action = action;

        return coinLogAuditLogRepo.save(toInsert);
      }),
    );
  }
}
