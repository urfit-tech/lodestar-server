import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtMember } from '~/auth/auth.dto';
import { AuthGuard } from '~/auth/auth.guard';
import { Local } from '~/decorator';
import { CouponService } from './coupon.service';

@UseGuards(AuthGuard)
@Controller({
  path: 'coupons',
  version: '2',
})
export class CouponController {
  constructor(private couponService: CouponService) {}

  @Get()
  async getCouponByMemberId(@Local('member') member: JwtMember, @Req() request: Request) {
    const { memberId, includeDeleted } = request.query;

    return this.couponService.getCouponByMemberId(
      member.appId,
      String(memberId || member.memberId),
      includeDeleted && String(includeDeleted) === 'true',
    );
  }
}
