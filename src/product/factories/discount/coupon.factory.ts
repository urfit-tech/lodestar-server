import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IDiscountFactory } from '~/product/interfaces/discount.interface';
import { CouponInfrastructure } from '~/coupon/coupon.infra';
import { CouponDiscount, Discount } from '~/product/domain/discount.model';
import { OrderProductStructType } from '~/product/domain/product.model';

@Injectable()
export class CouponFactory implements IDiscountFactory {
  constructor(
    private readonly couponInfra: CouponInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async createDiscount(id: string, products: OrderProductStructType[]): Promise<Discount> {
    const coupon = await this.couponInfra.getCouponById(id, this.entityManager);

    return new CouponDiscount({ id: '1', name: '1', description: '1', price: 1, coupon: coupon, products });
  }
}
