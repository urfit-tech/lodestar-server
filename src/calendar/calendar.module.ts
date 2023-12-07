import { Module } from '@nestjs/common';

import { CouponInfrastructure } from '~/coupon/coupon.infra';
import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { MemberInfrastructure } from '~/member/member.infra';
import { MemberService } from '~/member/member.service';
import { OrderInfrastructure } from '~/order/order.infra';
import { OrderService } from '~/order/order.service';
import { ProductInfrastructure } from '~/product/product.infra';
import { SharingCodeInfrastructure } from '~/sharingCode/sharingCode.infra';
import { VoucherInfrastructure } from '~/voucher/voucher.infra';

import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

@Module({
  controllers: [CalendarController],
  imports: [],
  providers: [
    CalendarService,
    CouponInfrastructure,
    DefinitionInfrastructure,
    MemberInfrastructure,
    MemberService,
    OrderInfrastructure,
    OrderService,
    ProductInfrastructure,
    SharingCodeInfrastructure,
    VoucherInfrastructure,
  ],
  exports: [],
})
export class CalendarModule {}
