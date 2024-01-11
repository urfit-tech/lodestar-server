import { Queue } from 'bull';
import {
  Logger,
  Controller,
  Body,
  Get,
  Post,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
  Delete,
  Param,
  Req,
  Ip,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

import { AuthGuard } from '~/auth/auth.guard';
import { JwtMember } from '~/auth/auth.dto';
import { ImportJob, ImporterTasker } from '~/tasker/importer.tasker';
import { ExporterTasker, MemberExportJob } from '~/tasker/exporter.tasker';
import { Local } from '~/decorator';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiHideProperty, ApiTags } from '@nestjs/swagger';

import {
  MemberDeleteResultDTO,
  MemberExportDTO,
  MemberGetDTO,
  MemberGetResultDTO,
  MemberImportDTO,
  SaleLeadMemberDataResponseDTO,
  SaleLeadMemberDataResquestDTO,
} from './member.dto';
import { MemberService } from './member.service';
import { APIException } from '~/api.excetion';
import { ExecutorInfo, DeleteMemberInfo } from './member.type';

@UseGuards(AuthGuard)
@ApiTags('Member')
@ApiBearerAuth()
@Controller({
  path: 'members',
  version: '2',
})
export class MemberController {
  private readonly jwtSecret: string;

  constructor(
    private logger: Logger,
    @InjectQueue(ImporterTasker.name) private readonly importerQueue: Queue,
    @InjectQueue(ExporterTasker.name) private readonly exportQueue: Queue,
    private readonly configService: ConfigService<{
      HASURA_JWT_SECRET: string;
    }>,
    private readonly memberService: MemberService,
  ) {
    this.jwtSecret = configService.getOrThrow('HASURA_JWT_SECRET');
  }

  // TODO: Should be deprecated with proper design with query parameter
  @Post()
  @ApiExcludeEndpoint()
  public async getMembersByPost(
    @Local('member') member: JwtMember,
    @Body() dto: MemberGetDTO,
  ): Promise<MemberGetResultDTO> {
    const { option, condition } = dto;
    if (option && option.nextToken && option.prevToken) {
      throw new BadRequestException('nextToken & prevToken cannot appear in the same request.');
    }

    const { appId, permissions } = member;

    if (
      ![
        'MEMBER_ADMIN',
        'POST_ADMIN',
        'SALES_RECORDS_NORMAL',
        'SALES_RECORDS_ADMIN',
        'PROGRAM_ADMIN',
        'PROGRAM_PACKAGE_TEMPO_DELIVERY_ADMIN',
        'APPOINTMENT_PLAN_ADMIN',
        'COIN_ADMIN',
        'SALES_LEAD_SELECTOR_ADMIN',
        'SHIPPING_ADMIN',
        'SHIPPING_NORMAL',
        'MEMBER_PHONE_ADMIN',
        'PROJECT_PORTFOLIO_NORMAL',
        'PROJECT_PORTFOLIO_ADMIN',
        'SALES_PERFORMANCE_ADMIN',
        'SALES_LEAD_ADMIN',
        'SALES_LEAD_NORMAL',
        'MATERIAL_AUDIT_LOG_ADMIN',
      ].some((e) => permissions.includes(e))
    ) {
      throw new UnauthorizedException(
        { message: 'missing required permission' },
        'User permission is not met required permissions.',
      );
    }

    return this.memberService.getMembersByCondition(appId, option, condition);
  }

  @Get()
  @ApiExcludeEndpoint()
  public async getMembers(@Local('member') member: JwtMember, @Body() dto: MemberGetDTO): Promise<MemberGetResultDTO> {
    const { option, condition } = dto;
    if (option && option.nextToken && option.prevToken) {
      throw new BadRequestException('nextToken & prevToken cannot appear in the same request.');
    }

    const { appId, permissions } = member;

    if (
      ![
        'MEMBER_ADMIN',
        'POST_ADMIN',
        'SALES_RECORDS_NORMAL',
        'SALES_RECORDS_ADMIN',
        'PROGRAM_ADMIN',
        'PROGRAM_PACKAGE_TEMPO_DELIVERY_ADMIN',
        'APPOINTMENT_PLAN_ADMIN',
        'COIN_ADMIN',
        'SALES_LEAD_SELECTOR_ADMIN',
        'SHIPPING_ADMIN',
        'SHIPPING_NORMAL',
        'MEMBER_PHONE_ADMIN',
        'PROJECT_PORTFOLIO_NORMAL',
        'PROJECT_PORTFOLIO_ADMIN',
        'SALES_PERFORMANCE_ADMIN',
        'SALES_LEAD_ADMIN',
        'SALES_LEAD_NORMAL',
        'MATERIAL_AUDIT_LOG_ADMIN',
      ].some((e) => permissions.includes(e))
    ) {
      throw new UnauthorizedException(
        { message: 'missing required permission' },
        'User permission is not met required permissions.',
      );
    }

    return this.memberService.getMembersByCondition(appId, option, condition);
  }

  @Post('import')
  @ApiExcludeEndpoint()
  public async importMembers(@Local('member') member: JwtMember, @Body() metadata: MemberImportDTO): Promise<void> {
    const { memberId: invokerMemberId } = member;

    const { appId, fileInfos } = metadata;
    const importJob: ImportJob = {
      appId,
      invokerMemberId,
      category: 'member',
      fileInfos: fileInfos.map(({ key, checksum }) => ({
        checksumETag: checksum,
        fileName: key,
      })),
    };
    await this.importerQueue.add(importJob, { removeOnComplete: true, removeOnFail: true });
  }

  @Post('export')
  @ApiExcludeEndpoint()
  public async exportMembers(@Local('member') member: JwtMember, @Body() metadata: MemberExportDTO): Promise<void> {
    const { memberId: invokerMemberId } = member;

    const { appId, memberIds, exportMime } = metadata;
    const exportJob: MemberExportJob = {
      appId,
      invokerMemberId: invokerMemberId,
      category: 'member',
      memberIds,
      exportMime,
    };
    await this.exportQueue.add(exportJob, { removeOnComplete: true, removeOnFail: true });
  }
  @Post('saleLeadMemberData')
  public async getSaleLeadMemberData(
    @Body() requestDto: SaleLeadMemberDataResquestDTO,
  ): Promise<SaleLeadMemberDataResponseDTO> {
    const errors = [];

    if (!requestDto.appId || typeof requestDto.appId !== 'string' || requestDto.appId.trim() === '') {
      errors.push('appId must be a string and cannot be empty');
    }

    if (errors.length > 0) {
      throw new APIException(
        { code: 'SaleLeadMemberData_Error', message: 'Invalid request parameters', result: errors },
        400,
      );
    }

    try {
      return await this.memberService.getSaleLeadMemberData(requestDto.managerId, requestDto.appId);
    } catch (error) {
      console.error('Error fetching sale lead member data:', error);

      throw new APIException(
        { code: 'SaleLeadMemberData_Error', message: 'Error fetching sale lead member data', result: error },
        500,
      );
    }
  }

  @Delete('email/:email')
  public async deleteMember(
    @Ip() ip: string,
    @Local('member') member: JwtMember,
    @Param('email') email: string,
  ): Promise<MemberDeleteResultDTO> {
    const { appId, role, memberId } = member;
    let log;
    let deleteResult;
    let response;

    if (role !== 'app-owner') {
      throw new UnauthorizedException(
        { message: 'no permission to delete member' },
        'User permission is not met required permissions.',
      );
    }

    try {
      deleteResult = await this.memberService.deleteMemberByEmail(appId, email);
      response = { code: 'SUCCESS', message: deleteResult };
    } catch (error) {
      response = { code: 'ERROR', message: error.message };
      throw new APIException(response);
    } finally {
      const deleteMemberInfo: DeleteMemberInfo = {
        email: email,
        id: deleteResult?.raw[0].member || '',
        appId: appId,
      };
      const executorMemberInfo: ExecutorInfo = {
        memberId: memberId,
        ipAddress: ip,
        dateTime: new Date(),
        executeResult: JSON.stringify(response),
      };

      log = await this.memberService.logMemberDeletionEventInfo(deleteMemberInfo, executorMemberInfo);

      console.log(`Log Details:
        ID: ${log?.id}
        Delete Member ID: ${log?.member_id}
        Action: ${log?.action}
        Delete Log: ${log?.target}
        Created At: ${log?.created_at}`);
    }

    return response;
  }
}
