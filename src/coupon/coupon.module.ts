import { Module } from '@nestjs/common';
import { CouponInfrastructure } from './coupon.infra';
import { CouponController } from './coupon.controller';
import { AuthModule } from '~/auth/auth.module';
import { MemberModule } from '~/member/member.module';
import { CouponService } from './coupon.service';
import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { OrderInfrastructure } from '~/order/order.infra';
import { UtilityService } from '~/utility/utility.service';

@Module({
  controllers: [CouponController],
  imports: [AuthModule, MemberModule],
  providers: [CouponInfrastructure, CouponService, DefinitionInfrastructure, OrderInfrastructure, UtilityService],
  exports: [CouponInfrastructure],
})
export class CouponModule {}
