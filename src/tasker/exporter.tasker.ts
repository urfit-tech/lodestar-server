import { Job } from 'bull';
import { Process, Processor } from '@nestjs/bull';
import { DynamicModule } from '@nestjs/common';

import { Tasker } from './tasker';

export type ExportCategory = 'member';

export interface ExportJob {
  appId: string;
  invokerMemberId: string;
  category: ExportCategory;
}

export type MemberExportJob = ExportJob & {
  category: 'member';
  memberIds: Array<string>;
}

@Processor(ExporterTasker.name)
export class ExporterTasker extends Tasker {
  static forRoot(): DynamicModule {
    return {
      module: ExporterTasker,
      imports: [],
      providers: [],
    };
  }

  @Process()
  async process(job: Job<ExportJob>): Promise<void> {}
}
