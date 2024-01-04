import { EntityManager, FindOptionsSelect, FindOptionsWhere, In } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MemberService } from '~/member/member.service';
import { APIException } from '~/api.excetion';
import { VoucherInfrastructure } from './voucher.infra';
import { OrderInfrastructure } from '~/order/order.infra';
import { OrderDiscount } from '~/order/entity/order_discount.entity';
import dayjs from 'dayjs';
import { UtilityService } from '~/utility/utility.service';

@Injectable()
export class VoucherService {
  constructor(
    private readonly memberService: MemberService,
    private readonly utilityService: UtilityService,
    private readonly voucherInfra: VoucherInfrastructure,
    private readonly orderInfra: OrderInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  public async getVoucherByMemberId(appId: string, memberId: string, includeDeleted?: boolean) {
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

    const voucherEnrollment = await this.voucherInfra.getVoucherEnrollment(memberId, this.entityManager);

    const wrapCondition: FindOptionsWhere<OrderDiscount> = {
      target: In(voucherEnrollment.map((voucher) => voucher.id)),
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
      voucherEnrollment
        .filter((voucher) => includeDeleted || voucher.voucherCode.deletedAt === null)
        .map((voucher) => {
          const startedAt = voucher.voucherCode.voucherPlan.startedAt;
          const endedAt = voucher.voucherCode.voucherPlan.endedAt;
          return {
            ...voucher,
            status: {
              outdated:
                !!(startedAt && dayjs(startedAt).isAfter(dayjs())) || !!(endedAt && dayjs(endedAt).isBefore(dayjs())),
              used: !!orderDiscountEnrollment.find((od) => od.target === voucher.id),
            },
          };
        }),
    );
  }
}
