import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtMember } from '~/auth/auth.dto';
import { AuthGuard } from '~/auth/auth.guard';
import { Local } from '~/decorator';
import { ProgramService } from './program.service';

@UseGuards(AuthGuard)
@Controller({
  path: 'programs',
  version: '2',
})
export class ProgramController {
  constructor(private programService: ProgramService) {}

  @Get()
  async getProgramByMemberId(@Local('member') member: JwtMember, @Req() request: Request) {
    const { memberId } = request.query;

    return this.programService.getProgramByMemberId(member.appId, String(memberId || member.memberId));
  }

  @Get('/expired')
  async getExpiredProgramByMemberId(@Local('member') member: JwtMember, @Req() request: Request) {
    const { memberId } = request.query;

    return this.programService.getExpiredProgramByMemberId(member.appId, String(memberId || member.memberId));
  }
}
