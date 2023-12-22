import { EntityManager, FindOptionsSelect, FindOptionsWhere, In } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MemberService } from '~/member/member.service';
import { APIException } from '~/api.excetion';

import { OrderInfrastructure } from '~/order/order.infra';
import { OrderDiscount } from '~/order/entity/order_discount.entity';
import dayjs from 'dayjs';
import { UtilityService } from '~/utility/utility.service';
import { CouponInfrastructure } from './coupon.infra';

@Injectable()
export class CouponService {
  constructor(
    private readonly memberService: MemberService,
    private readonly utilityService: UtilityService,
    private readonly couponInfra: CouponInfrastructure,
    private readonly orderInfra: OrderInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  public async getCouponByMemberId(appId: string, memberId: string, includeDeleted?: boolean) {
    // Todo: check permission
    // ...

    const { data: memberData } = await this.memberService.getMembersByCondition(appId, { limit: 1 }, { id: memberId });
    if (memberData.length === 0) {
      throw new APIException({
        code: 'E_NO_MEMBER',
        message: 'member not found',
        result: null,
      });
    }

    const couponEnrollment = await this.couponInfra.getCouponEnrollment(memberId, this.entityManager);

    const wrapCondition: FindOptionsWhere<OrderDiscount> = {
      target: In(couponEnrollment.map((coupon) => coupon.id)),
      order: {
        status: 'SUCCESS',
        memberId,
      },
    };
    const warpSelect: FindOptionsSelect<OrderDiscount> = {
      target: true,
    };
    const orderDiscountEnrollment = await this.orderInfra.exportOrderDiscountsByAppId(
      appId,
      this.entityManager,
      wrapCondition,
      warpSelect,
    );

    return this.utilityService.convertObjectKeysToCamelCase(
      couponEnrollment
        .filter((coupon) => includeDeleted || coupon.couponCode.deletedAt === null)
        .map((coupon) => {
          const startedAt = coupon.couponCode.couponPlan.startedAt;
          const endedAt = coupon.couponCode.couponPlan.endedAt;
          return {
            ...coupon,
            status: {
              outdated:
                !!(startedAt && dayjs(startedAt).isAfter(dayjs())) || !!(endedAt && dayjs(endedAt).isBefore(dayjs())),
              used: !!orderDiscountEnrollment.find((od) => od.target === coupon.id),
            },
          };
        }),
    );
  }
}
