import { Queue } from 'bull';
import jwt from 'jsonwebtoken';
import { 
  Logger,
  Controller,
  Headers,
  Body,
  Get,
  Post,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

import { ImportJob, ImporterTasker } from '~/tasker/importer.tasker';
import { ExporterTasker, MemberExportJob } from '~/tasker/exporter.tasker';

import {
  MemberExportDTO,
  MemberGetDTO, 
  MemberGetResultDTO,
  MemberImportDTO,
} from './member.dto';
import { MemberService } from './member.service';

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
  
  private verify(authorization: string): Record<string, any> {
    try {
      const [_, token] = authorization.split(' ');
      return jwt.verify(token, this.jwtSecret) as Record<string, any>;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException();
    }
  }

  @Get()
  public async getMembers(
    @Headers('Authorization') authorization: string,
    @Body() dto: MemberGetDTO,
  ): Promise<MemberGetResultDTO> {
    const { option, condition } = dto;
    if (option && option.nextToken && option.prevToken) {
      throw new BadRequestException('nextToken & prevToken cannot appear in the same request.');
    }

    const { appId, permissions } = this.verify(authorization);

    if (![
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
    ].some((e) => permissions.includes(e))) {
      throw new UnauthorizedException(
        { message: 'missing required permission' },
        'User permission is not met required permissions.',
      );
    }

    return this.memberService.getMembersByCondition(appId, option, condition);
  }

  @Post('import')
  public async importMembers(
    @Headers('Authorization') authorization: string,
    @Body() metadata: MemberImportDTO,
  ): Promise<void> {
    const { memberId: invokerMemberId } = this.verify(authorization);

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
    await this.importerQueue.add(importJob);
  }

  @Post('export')
  public async exportMembers(
    @Headers('Authorization') authorization: string,
    @Body() metadata: MemberExportDTO,
  ): Promise<void> {
    const { memberId: invokerMemberId } = this.verify(authorization);

    const { appId, memberIds, exportMime } = metadata;
    const exportJob: MemberExportJob = {
      appId,
      invokerMemberId: invokerMemberId,
      category: 'member',
      memberIds,
      exportMime,
    };
    await this.exportQueue.add(exportJob);
  }
}
