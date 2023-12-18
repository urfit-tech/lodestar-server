import { Module } from '@nestjs/common';
import { VoucherPlanService } from './voucher-plan/voucher-plan.service';
import { VoucherInfrastructure } from './voucher.infra';
import { MemberModule } from '~/member/member.module';
import { AuthModule } from '~/auth/auth.module';
import { VoucherService } from './voucher.service';
import { MemberService } from '~/member/member.service';
import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { VoucherController } from './voucher.controller';
import { OrderInfrastructure } from '~/order/order.infra';
import { UtilityService } from '~/utility/utility.service';

@Module({
  controllers: [VoucherController],
  imports: [AuthModule, MemberModule],
  providers: [
    VoucherPlanService,
    VoucherInfrastructure,
    VoucherService,
    MemberService,
    DefinitionInfrastructure,
    OrderInfrastructure,
    UtilityService,
  ],
  exports: [VoucherInfrastructure],
})
export class VoucherModule {}
