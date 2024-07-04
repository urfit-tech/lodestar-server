import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { EntityManager } from 'typeorm';
import { CoinInfrastructure } from './coin.infra';

@Injectable()
export class CoinService {
  constructor(
    private readonly coinInfra: CoinInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async claimCoin(coinId: string, memberId: string): Promise<{ success: boolean; message: string }> {
    if (!memberId) {
      return { success: false, message: '請輸入會員ID' };
    }
    const coin = await this.coinInfra.getMemberCoin(coinId, memberId, this.entityManager);

    if (!coin) {
      return { success: false, message: '這個會員沒有這個代幣' };
    }

    const currentTime = new Date();
    if (!!coin.claimedAt) {
      return { success: false, message: '代幣已被領取' };
    }
    console.log(coin.claimStartedAt);
    console.log(dayjs(coin.claimStartedAt).isAfter(currentTime));

    if (
      (coin.claimStartedAt && dayjs(coin.claimStartedAt).isAfter(currentTime)) ||
      (coin.claimEndedAt && dayjs(coin.claimEndedAt).isBefore(currentTime))
    ) {
      return { success: false, message: '不在代幣領取時間內' };
    }

    await this.coinInfra.claimCoin(coinId, memberId, this.entityManager);
    return { success: true, message: '領取成功' };
  }
}
