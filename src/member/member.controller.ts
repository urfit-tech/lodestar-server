import { Queue } from 'bull';
import jwt from 'jsonwebtoken';
import { Body, Controller, Headers, Logger, Post, UnauthorizedException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

import { ImportJob, ImporterTasker } from '~/tasker/importer.tasker';
import { ExporterTasker, MemberExportJob } from '~/tasker/exporter.tasker';

import { MemberExportDTO, MemberImportDTO } from './member.dto';

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

  @Post('import')
  public async importMembers(
    @Headers('Authorization') authorization: string,
    @Body() metadata: MemberImportDTO,
  ): Promise<void> {
    this.verify(authorization);

    const { appId, fileInfos } = metadata;
    const importJob: ImportJob = {
      appId,
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

    const { appId, memberIds } = metadata;
    const exportJob: MemberExportJob = {
      appId,
      invokerMemberId: invokerMemberId,
      category: 'member',
      memberIds,
    };
    await this.exportQueue.add(exportJob);
  }
}
