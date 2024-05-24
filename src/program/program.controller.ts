import { Controller, Get, Logger, Param, Req, UnauthorizedException, UseGuards, Headers, Query } from '@nestjs/common';
import { Request } from 'express';
import { APIException } from '~/api.excetion';
import { JwtMember } from '~/auth/auth.dto';
import { AuthGuard } from '~/auth/auth.guard';
import { AuthService } from '~/auth/auth.service';
import { Local } from '~/decorator';
import {
  MaterialsResponseDto,
  ProgramContentResponseDTO,
  ProgramContentsResponseDto,
  ProgramResponseDTO,
} from './program.dto';
import { ProgramService } from './program.service';

@Controller({
  path: 'programs',
  version: '2',
})
export class ProgramController {
  constructor(private authService: AuthService, private logger: Logger, private programService: ProgramService) {}

  @UseGuards(AuthGuard)
  @Get('/expired')
  async getExpiredProgramByMemberId(@Local('member') member: JwtMember, @Req() request: Request) {
    const { memberId } = request.query;

    return this.programService.getExpiredProgramByMemberId(member.appId, String(memberId || member.memberId));
  }

  @UseGuards(AuthGuard)
  @Get('/:programId')
  async getProgramByMemberId(
    @Local('member') member: JwtMember,
    @Param('programId') programId: string,
  ): Promise<ProgramResponseDTO> {
    const { permissions } = member;

    const extraAllowPermission = ['PROGRAM_NORMAL'].find((e) => permissions.includes(e));
    return ['PROGRAM_ADMIN'].some((e) => permissions.includes(e))
      ? this.programService.getProgramByProgramId(programId)
      : this.programService.getProgramByMemberId(member.memberId, programId, extraAllowPermission);
  }

  @Get('/:programId/contents/:programContentId')
  async getEnrolledProgramContentById(
    @Param('programId') programId: string,
    @Param('programContentId') programContentId: string,
    @Headers('Authorization') authorization?: string,
  ): Promise<ProgramContentResponseDTO[]> {
    let programContent: ProgramContentResponseDTO;

    try {
      programContent = await this.programService.getProgramContentById(programContentId);
    } catch (err) {
      throw new APIException(
        { code: 'E_PROGRAM_CONTENT_NOT_FOUND', message: 'Unable to retrieve program content' },
        400,
      );
    }

    const isTrial = programContent.displayMode === 'trial';
    const isLoginToTrial = programContent.displayMode === 'loginToTrial';
    const member = !!authorization && (await this._verifyAuthorization(authorization));

    const extraAllowPermission = !!member && ['PROGRAM_NORMAL'].find((e) => member.permissions.includes(e));
    const adminPermission = !!member && ['PROGRAM_ADMIN'].find((e) => member.permissions.includes(e));

    return adminPermission || (!!member && isLoginToTrial) || isTrial
      ? { ...programContent, isEquity: true }
      : !!member
      ? this.programService.getEnrolledProgramContentById(
          member.appId,
          member.memberId,
          programId,
          programContentId,
          extraAllowPermission,
        )
      : this.programService.getProgramContentInfo(programContentId);
  }

  @UseGuards(AuthGuard)
  @Get('/:programId/contents')
  async getEnrolledProgramContentsByProgramId(
    @Local('member') member: JwtMember,
    @Req() request: Request,
    @Param('programId') programId: string,
  ): Promise<ProgramContentsResponseDto[]> {
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
  @Get()
  async getProgramsByMemberId(@Local('member') member: JwtMember, @Query('memberId') memberId: string) {
    return this.programService.getProgramsByMemberId(member.appId, String(memberId || member.memberId));
  }

  @UseGuards(AuthGuard)
  @Get('/:programId/materials')
  async getProgramContentMaterialByProgramContentId(
    @Param('programId') programId: string,
  ): Promise<MaterialsResponseDto[]> {
    return this.programService.getProgramContentMaterialsByProgramId(programId);
  }

  private _verifyAuthorization(authorization: string) {
    const token = authorization.split(' ')[1];
    let member;
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      member = this.authService.verify(token);
      if (!member) {
        throw new UnauthorizedException('Invalid or expired token');
      }
      return member;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
