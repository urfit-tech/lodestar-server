import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IDiscountFactory } from '~/product/interfaces/discount.interface';
import { CouponDiscount, Discount } from '~/product/domain/discount.model';
import { OrderProductStructType } from '~/product/domain/product.model';
import { DiscountInfrastructure } from '~/product/discount.infra';

@Injectable()
export class CouponFactory implements IDiscountFactory {
  constructor(
    private readonly discountInfra: DiscountInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async createDiscount(id: string, products: OrderProductStructType[]): Promise<Discount> {
    const coupon = await this.discountInfra.getCouponById(id, this.entityManager);

    return new CouponDiscount({
      id,
      name: `【折價券】${coupon.couponCode.couponPlan.title}`,
      description: coupon.couponCode.couponPlan.description,
      coupon: coupon,
      products,
    });
  }
}
