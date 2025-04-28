import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IDiscountFactory } from '~/product/interfaces/discount.interface';
import { Discount, PointDiscount } from '~/product/domain/discount.model';
import { OrderProductStructType } from '~/product/domain/product.model';
import { DiscountInfrastructure } from '~/product/discount.infra';

@Injectable()
export class PointFactory implements IDiscountFactory {
  constructor(
    private readonly discountInfra: DiscountInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async createDiscount(id: string, products: OrderProductStructType[]): Promise<Discount> {
    const points = await this.discountInfra.getRemaingPoints(id, this.entityManager);
    const appSettings = await this.discountInfra.getAppSettingByMemberId(id, this.entityManager);

    return new PointDiscount({
      id,
      name: '',
      description: '',
      points,
      products,
      pointExchangeRateSetting: appSettings['point.exchange_rate'],
    });
  }
}
