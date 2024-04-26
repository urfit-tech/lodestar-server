import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtMember } from '~/auth/auth.dto';
import { AuthGuard } from '~/auth/auth.guard';
import { Local } from '~/decorator';
import { ProgramService } from './program.service';

@Controller({
  path: 'programs',
  version: '2',
})
export class ProgramController {
  constructor(private programService: ProgramService) {}

  @UseGuards(AuthGuard)
  @Get('/expired')
  async getExpiredProgramByMemberId(@Local('member') member: JwtMember, @Req() request: Request) {
    const { memberId } = request.query;

    return this.programService.getExpiredProgramByMemberId(member.appId, String(memberId || member.memberId));
  }

  @UseGuards(AuthGuard)
  @Get('/:programId')
  async getProgramByMemberId(@Local('member') member: JwtMember, @Param('programId') programId: string) {
    const { permissions } = member;

    const extraAllowPermission = ['PROGRAM_NORMAL'].find((e) => permissions.includes(e));
    return ['PROGRAM_ADMIN'].some((e) => permissions.includes(e))
      ? this.programService.getProgramByProgramId(programId)
      : this.programService.getProgramByMemberId(member.memberId, programId, extraAllowPermission);
  }

  @Get('/:programId/contents/:programContentId/trial')
  async getProgramContentById(@Param('programContentId') programContentId: string) {
    const programContent = await this.programService.getProgramContentById(programContentId);

    return programContent.displayMode === 'trial'
      ? this.programService.getTrialProgramContent(programContentId)
      : programContent.displayMode === 'loginToTrial'
      ? this.programService.getLoginToTrialProgramContent(programContentId)
      : {};
  }

  @UseGuards(AuthGuard)
  @Get('/:programId/contents/:programContentId')
  async getEnrolledProgramContentById(
    @Local('member') member: JwtMember,
    @Req() request: Request,
    @Param('programId') programId: string,
    @Param('programContentId') programContentId: string,
  ) {
    const { memberId } = request.query;

    const programContent = await this.programService.getProgramContentById(programContentId);
    const loginToTrialProgramContent = await this.programService.getLoginToTrialProgramContent(programContentId);
    const extraAllowPermission = ['PROGRAM_NORMAL'].find((e) => member.permissions.includes(e));

    return programContent.displayMode === 'loginToTrial'
      ? { ...loginToTrialProgramContent, isEquity: true }
      : ['PROGRAM_ADMIN'].find((e) => member.permissions.includes(e))
      ? { ...programContent, isEquity: true }
      : this.programService.getEnrolledProgramContentById(
          member.appId,
          String(memberId || member.memberId),
          programId,
          programContentId,
          extraAllowPermission,
        );
  }

  @UseGuards(AuthGuard)
  @Get('/:programId/contents')
  async getEnrolledProgramContentsByProgramId(
    @Local('member') member: JwtMember,
    @Req() request: Request,
    @Param('programId') programId: string,
  ) {
    const { memberId } = request.query;
    const { role, permissions } = member;

    const extraAllowPermission = ['PROGRAM_NORMAL'].find((e) => permissions.includes(e));

    return role === 'app-owner' || ['PROGRAM_ADMIN'].some((e) => permissions.includes(e))
      ? this.programService.getProgramContentsByProgramId(member.appId, programId)
      : this.programService.getEnrolledProgramContentsByProgramId(
          member.appId,
          String(memberId || member.memberId),
          programId,
          extraAllowPermission,
        );
  }

  @UseGuards(AuthGuard)
  @Get('/:programId/materials')
  async getProgramContentMaterialByProgramContentId(@Param('programId') programId: string) {
    return this.programService.getProgramContentMaterialsByProgramId(programId);
  }
}
