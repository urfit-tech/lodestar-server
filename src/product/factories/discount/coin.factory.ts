import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IDiscountFactory } from '~/product/interfaces/discount.interface';
import { CoinDiscount, Discount } from '~/product/domain/discount.model';
import { OrderProductStructType } from '~/product/domain/product.model';
import { DiscountInfrastructure } from '~/product/discount.infra';

@Injectable()
export class CoinFactory implements IDiscountFactory {
  constructor(
    private readonly discountInfra: DiscountInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async createDiscount(id: string, products: OrderProductStructType[]): Promise<Discount> {
    const coins = await this.discountInfra.getRemainingCoins(id, this.entityManager);
    const appSettings = await this.discountInfra.getAppSettingByMemberId(id, this.entityManager);

    return new CoinDiscount({
      id,
      name: `【代幣折抵】`,
      description: '',
      coins: coins,
      products,
      coinExChangeRateAppSetting: appSettings['coin.exchange_rate'],
    });
  }
}
