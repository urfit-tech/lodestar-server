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
  Ip,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

import { AuthGuard } from '~/auth/auth.guard';
import { JwtMember } from '~/auth/auth.dto';
import { ImportJob } from '~/tasker/importer.tasker';
import { ExporterTasker, MemberExportJob } from '~/tasker/exporter.tasker';
import { Local } from '~/decorator';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';

import {
  MemberDeleteResultDTO,
  MemberExportDTO,
  MemberGetConditionDTO,
  MemberGetDTO,
  MemberGetResultDTO,
  MemberImportDTO,
  SaleLeadMemberDataResponseDTO,
  SaleLeadMemberDataResquestDTO,
} from './member.dto';
import { MemberService } from './member.service';
import { APIException } from '~/api.excetion';
import { ExecutorInfo, DeleteMemberInfo } from './member.type';
import { Permissions } from '~/decorators/permissions.decorator';
import { PermissionSet } from '~/enums/PermissionSet.enum';
import { PermissionGuard } from '~/auth/permission.guard';
import { chunk } from 'lodash';

const MEMBER_PERMISSION_GROUP_ADMIN: PermissionSet[] = [
  PermissionSet.MEMBER_ADMIN,
  PermissionSet.POST_ADMIN,
  PermissionSet.SALES_RECORDS_NORMAL,
  PermissionSet.SALES_RECORDS_ADMIN,
  PermissionSet.PROGRAM_ADMIN,
  PermissionSet.PROGRAM_PACKAGE_TEMPO_DELIVERY_ADMIN,
  PermissionSet.APPOINTMENT_PLAN_ADMIN,
  PermissionSet.COIN_ADMIN,
  PermissionSet.SALES_LEAD_SELECTOR_ADMIN,
  PermissionSet.SHIPPING_ADMIN,
  PermissionSet.SHIPPING_NORMAL,
  PermissionSet.MEMBER_PHONE_ADMIN,
  PermissionSet.PROJECT_PORTFOLIO_ADMIN,
  PermissionSet.SALES_PERFORMANCE_ADMIN,
  PermissionSet.SALES_LEAD_ADMIN,
  PermissionSet.SALES_LEAD_NORMAL,
  PermissionSet.MATERIAL_AUDIT_LOG_ADMIN,
];

const MEMBER_DOWNLOAD_PERMISSION_GROUP: PermissionSet[] = [
  PermissionSet.MEMBER_ADMIN,
  PermissionSet.MEMBER_CREATE,
  PermissionSet.SALES_LEAD_ADMIN,
  PermissionSet.SALES_LEAD_NORMAL,
  PermissionSet.SALES_PERFORMANCE_ADMIN,
];

@UseGuards(AuthGuard, PermissionGuard)
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
    @InjectQueue('ImportTasker') private readonly importerQueue: Queue,
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
  @Permissions(...MEMBER_PERMISSION_GROUP_ADMIN)
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

    return this.memberService.getMembersByCondition(appId, option, condition);
  }

  @Get()
  @Permissions(...MEMBER_PERMISSION_GROUP_ADMIN)
  @ApiExcludeEndpoint()
  public async getMembers(@Local('member') member: JwtMember, @Body() dto: MemberGetDTO): Promise<MemberGetResultDTO> {
    const { option, condition } = dto;
    if (option && option.nextToken && option.prevToken) {
      throw new BadRequestException('nextToken & prevToken cannot appear in the same request.');
    }

    const { appId, permissions } = member;

    return this.memberService.getMembersByCondition(appId, option, condition);
  }

  @Post('member-role-count')
  @Permissions(...MEMBER_PERMISSION_GROUP_ADMIN)
  @ApiExcludeEndpoint()
  public async getMembersRoleCountList(@Local('member') member: JwtMember, @Body() condition: MemberGetConditionDTO) {
    const { appId } = member;

    const result = await this.memberService.getMembersRoleCountList(appId, condition);

    return result;
  }

  @Post('import')
  @Permissions(...MEMBER_PERMISSION_GROUP_ADMIN)
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
  @Permissions(...MEMBER_DOWNLOAD_PERMISSION_GROUP)
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

  @Post('delete')
  public async deleteMembers(
    @Ip() ip: string,
    @Local('member') member: JwtMember,
    @Body('emails') emails: Array<string>,
  ) {
    const { appId, role, memberId } = member;

    if (role !== 'app-owner') {
      throw new UnauthorizedException(
        { message: 'no permission to delete member' },
        'User permission is not met required permissions.',
      );
    }

    const CHUNK_SIZE = 500;
    const MAX_PARALLEL = 3;
    const emailChunks = chunk(emails, CHUNK_SIZE);

    const allDeletedEmails: string[] = [];
    let totalAffected = 0;

    try {
      for (let i = 0; i < emailChunks.length; i += MAX_PARALLEL) {
        const batchChunks = emailChunks.slice(i, i + MAX_PARALLEL);

        const results = await Promise.all(
          batchChunks.map(async (emailChunk, batchIndex) => {
            const deleteResult = await this.memberService.deleteMembersByEmails(appId, emailChunk);

            for (const raw of deleteResult.raw) {
              for (const member of raw.members) {
                const deleteMemberInfo: DeleteMemberInfo = {
                  email: member.email,
                  id: member.id || '',
                  appId: appId,
                };
                const executorMemberInfo: ExecutorInfo = {
                  memberId,
                  ipAddress: ip,
                  dateTime: new Date(),
                  executeResult: JSON.stringify(member),
                };

                const log = await this.memberService.logMemberDeletionEventInfo(deleteMemberInfo, executorMemberInfo);

                console.log(`[Batch ${i + batchIndex}] Log Details:
                ID: ${log?.id}
                Delete Member ID: ${log?.memberId}
                Action: ${log?.action}
                Delete Log: ${log?.target}
                Created At: ${log?.createdAt}`);
              }
            }

            const deletedEmails = deleteResult.raw.map(r => r.members.map(member => member.email)).flat(Infinity);
            return {
              deletedEmails,
              affected: deleteResult.affected ?? 0,
            };
          }),
        );

        for (const result of results) {
          allDeletedEmails.push(...result.deletedEmails);
          totalAffected += result.affected;
        }
      }

      return {
        code: 'SUCCESS',
        message: {
          memberEmails: allDeletedEmails,
          affected: totalAffected,
        },
      };
    } catch (error) {
      const response = { code: 'ERROR', message: error.message };
      throw new APIException(response);
    }
  }
}
