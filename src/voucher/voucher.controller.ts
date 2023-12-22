import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtMember } from '~/auth/auth.dto';
import { AuthGuard } from '~/auth/auth.guard';
import { Local } from '~/decorator';
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
      String(memberId || member.memberId),
      includeDeleted && String(includeDeleted) === 'true',
    );
  }
}
