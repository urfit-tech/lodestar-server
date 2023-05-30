import { Job } from 'bull';
import { Process, Processor } from '@nestjs/bull';
import { DynamicModule } from '@nestjs/common';

import { DefinitionModule } from '~/definition/definition.module';
import { MemberInfrastructure } from '~/member/member.infra';
import { MemberService } from '~/member/member.service';
import { UtilityModule } from '~/utility/utility.module';
import { StorageService } from '~/utility/storage/storage.service';

import { Tasker } from './tasker';

export type ImportCategory = 'member';

export class ImportJob {
  appId: string;
  category: ImportCategory;
  fileInfos: Array<{
    checksumETag: string;
    fileName: string;
  }>;
}

@Processor(ImporterTasker.name)
export class ImporterTasker extends Tasker {
  static forRoot(): DynamicModule {
    return {
      module: ImporterTasker,
      imports: [
        UtilityModule,
        DefinitionModule,
      ],
      providers: [
        StorageService,
        MemberService,
        MemberInfrastructure,
      ],
    };
  }

  @Process()
  async process(job: Job<ImportJob>): Promise<void> {}
}
