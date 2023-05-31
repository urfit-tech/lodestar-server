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

  constructor(
    private readonly storageService: StorageService,
    private readonly memberService: MemberService,
  ) {
    super();
  }

  @Process()
  async process(job: Job<ImportJob>): Promise<void> {
    const { appId, category, fileInfos }: ImportJob = job.data;
    for (const fileInfo of fileInfos) {
      const { checksumETag, fileName } = fileInfo;

      try {
        const { ContentType, Body, ETag } = await this.storageService.getFileFromBucketStorage({
          Key: `${appId}/${fileName}`,
        });
        const uint8Array = await Body.transformToByteArray();

        if (`"${checksumETag}"` === ETag) {
          await this.importToDatabase(appId, category, ContentType, Buffer.from(uint8Array));
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  private importToDatabase(
    appId: string,
    category: ImportCategory,
    mimeType: string,
    rawBin: Buffer,
  ): Promise<void> {
    switch (category) {
      case 'member':
        return this.memberService.processMemberImportFromFile(appId, mimeType, rawBin);
    }
  }
}
