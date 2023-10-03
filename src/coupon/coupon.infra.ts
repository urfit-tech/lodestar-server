import { EntityManager, FindOptionsWhere } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Coupon } from '~/coupon/entity/coupon.entity';

@Injectable()
export class CouponInfrastructure {
  async getCouponsByConditions(conditions: FindOptionsWhere<Coupon>, manager: EntityManager) {
    const couponRepo = manager.getRepository(Coupon);
    const coupons = await couponRepo.find({
      where: {
        ...(conditions && { ...conditions }),
      },
      relations: {
        couponCode: {
          couponPlan: true,
        },
      },
    });
    return coupons;
  }
}
