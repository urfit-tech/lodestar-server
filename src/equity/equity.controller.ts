import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { Local } from '~/decorator';
import { JwtMember } from '~/auth/auth.dto';
import { ProgramService } from '~/program/program.service';
import { AuthGuard } from '~/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller({
  path: 'equity',
  version: '2',
})
export class EquityController {
  constructor(private programService: ProgramService) {}

  @Get('/programs')
  async getProgramsByMemberId(@Local('member') member: JwtMember, @Query('memberId') memberId: string) {
    return this.programService.getProgramsByMemberId(member.appId, String(memberId || member.memberId));
  }
}
