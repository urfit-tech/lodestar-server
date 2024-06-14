import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CoinLog } from '~/entity/CoinLog';

@Injectable()
export class CoinInfrastructure {
  async getMemberCoin(coinId: string, memberId: string, entityManager: EntityManager) {
    return entityManager.getRepository(CoinLog).findOne({
      where: {
        id: coinId,
        memberId,
      },
    });
  }

  async claimCoin(coinId: string, memberId: string, entityManager: EntityManager) {
    return entityManager.getRepository(CoinLog).update({ id: coinId, memberId }, { claimedAt: new Date() });
  }
}
