import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MemberService } from '~/member/member.service';
import { OrderInfrastructure } from '~/order/order.infra';
import { UtilityService } from '~/utility/utility.service';
import { GiftPlanInfrastructure } from './giftPlan.infra';

@Injectable()
export class CouponService {
  constructor(
    private readonly memberService: MemberService,
    private readonly utilityService: UtilityService,
    private readonly giftPlanInfra: GiftPlanInfrastructure,
    private readonly orderInfra: OrderInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}
}
