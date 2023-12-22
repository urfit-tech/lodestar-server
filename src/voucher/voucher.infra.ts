import { EntityManager, FindOptionsWhere } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Voucher } from './entity/voucher.entity';

@Injectable()
export class VoucherInfrastructure {
  async getVouchersByConditions(conditions: FindOptionsWhere<Voucher>, manager: EntityManager) {
    const voucher = manager.getRepository(Voucher);
    const vouchers = await voucher.find({
      where: {
        ...(conditions && { ...conditions }),
      },
      relations: {
        voucherCode: {
          voucherPlan: true,
        },
      },
    });
    return vouchers;
  }

  async getVoucherEnrollment(memberId: string, manager: EntityManager) {
    return this.getVoucherByMemberId(memberId, manager);
  }

  private getVoucherByMemberId(memberId: string, manager: EntityManager) {
    return manager
      .getRepository(Voucher)
      .createQueryBuilder('voucher')
      .innerJoinAndSelect('voucher.voucherCode', 'voucher_code')
      .innerJoinAndSelect('voucher_code.voucherPlan', 'voucher_plan')
      .innerJoinAndSelect('voucher_plan.voucherPlanProducts', 'voucher_plan_product')
      .where('voucher.memberId = :memberId', { memberId })
      .groupBy('voucher.id')
      .addGroupBy('voucher_code.id')
      .addGroupBy('voucher_plan.id')
      .select([
        'voucher.id id',
        'voucher_plan.id voucher_plan_id',
        'voucher_plan.title title',
        'voucher_plan.description description',
        'voucher_plan.started_at started_at',
        'voucher_plan.ended_at ended_at',
        'voucher_plan.is_transferable is_transferable',
        'voucher_plan.product_quantity_limit product_quantity_limit',
        `JSONB_BUILD_OBJECT('id', voucher_code.id, 'code', voucher_code.code, 'deleted_at', voucher_code.deleted_at) voucher_code`,
        `JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', voucher_plan_product.id, 'product_id', voucher_plan_product.product_id)) voucher_plan_products`,
      ])
      .getRawMany();
  }
}
