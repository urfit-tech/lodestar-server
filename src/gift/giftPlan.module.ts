import { Module } from '@nestjs/common';
import { AuthModule } from '~/auth/auth.module';
import { MemberModule } from '~/member/member.module';
import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { OrderInfrastructure } from '~/order/order.infra';
import { UtilityService } from '~/utility/utility.service';
import { GiftPlanInfrastructure } from './giftPlan.infra';

@Module({
  imports: [AuthModule, MemberModule],
  providers: [GiftPlanInfrastructure, DefinitionInfrastructure, OrderInfrastructure, UtilityService],
  exports: [GiftPlanInfrastructure],
})
export class GiftPlanModule {}
