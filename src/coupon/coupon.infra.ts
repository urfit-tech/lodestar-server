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

  async getCouponEnrollment(memberId: string, manager: EntityManager) {
    return manager
      .getRepository(Coupon)
      .find({ where: { memberId }, relations: { couponCode: { couponPlan: { couponPlanProducts: true } } } });

    // .createQueryBuilder('coupon')
    // .innerJoinAndSelect('coupon.couponCode', 'coupon_code')
    // .innerJoinAndSelect('coupon_code.couponPlan', 'coupon_plan')
    // .innerJoinAndSelect('coupon_plan.couponPlanProducts', 'coupon_plan_product')
    // .where('coupon.memberId = :memberId', { memberId })
    // .groupBy('coupon.id')
    // .addGroupBy('coupon_code.id')
    // .addGroupBy('coupon_plan.id')
    // .select([
    //   'coupon.id id',
    //   'coupon_plan.id coupon_plan_id',
    //   'coupon_plan.title title',
    //   'coupon_plan.description description',
    //   'coupon_plan.started_at started_at',
    //   'coupon_plan.ended_at ended_at',
    //   'coupon_plan.is_transferable is_transferable',
    //   'coupon_plan.product_quantity_limit product_quantity_limit',
    //   `JSONB_BUILD_OBJECT('id', coupon_code.id, 'code', coupon_code.code, 'deleted_at', coupon_code.deleted_at) coupon_code`,
    //   `JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', coupon_plan_product.id, 'product_id', coupon_plan_product.product_id)) coupon_plan_products`,
    // ])
    // .getRawMany();
  }
}
