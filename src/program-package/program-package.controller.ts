import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtMember } from '~/auth/auth.dto';
import { AuthGuard } from '~/auth/auth.guard';
import { Local } from '~/decorator';
import { ProgramPackageService } from './program-package.service';

@UseGuards(AuthGuard)
@Controller({
  path: 'program-packages',
  version: '2',
})
export class ProgramPackageController {
  constructor(private programPackageService: ProgramPackageService) {}

  @Get()
  async getProgramPackageByMemberId(@Local('member') member: JwtMember, @Req() request: Request) {
    const { memberId } = request.query;

    return this.programPackageService.getProgramPackageByMemberId(member.appId, String(memberId || member.memberId));
  }

  @Get('/expired')
  async getExpiredProgramPackageByMemberId(@Local('member') member: JwtMember, @Req() request: Request) {
    const { memberId } = request.query;

    return this.programPackageService.getExpiredProgramPackageByMemberId(
      member.appId,
      String(memberId || member.memberId),
    );
  }

  @Get('/:programPackageId')
  async getEnrolledProgramPackageById(
    @Local('member') member: JwtMember,
    @Param('programPackageId') programPackageId: string,
    @Req() request: Request,
  ) {
    const { memberId } = request.query;

    return this.programPackageService.getEnrolledProgramPackageById(
      member.appId,
      String(memberId || member.memberId),
      programPackageId,
    );
  }
}
