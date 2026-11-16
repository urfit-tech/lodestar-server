import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtMember } from '~/auth/auth.dto';
import { AuthGuard } from '~/auth/auth.guard';
import { Local } from '~/decorator';
import { MEMBER_VOUCHER_STAFF_PERMISSIONS, resolveTargetMemberId } from '~/auth/authorization.helper';
import { VoucherService } from './voucher.service';

@UseGuards(AuthGuard)
@Controller({
  path: 'vouchers',
  version: '2',
})
export class VoucherController {
  constructor(private voucherService: VoucherService) {}

  @Get()
  async getVoucherByMemberId(@Local('member') member: JwtMember, @Req() request: Request) {
    const { memberId, includeDeleted } = request.query;

    return this.voucherService.getVoucherByMemberId(
      member.appId,
      resolveTargetMemberId(member, memberId, MEMBER_VOUCHER_STAFF_PERMISSIONS),
      includeDeleted && String(includeDeleted) === 'true',
    );
  }
}
