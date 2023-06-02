import { Job, Queue } from 'bull';
import { parse } from 'csv-parse/sync';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { BullModule, InjectQueue, Process, Processor } from '@nestjs/bull';
import { DynamicModule } from '@nestjs/common';

import { DefinitionModule } from '~/definition/definition.module';
import { MemberInfrastructure } from '~/member/member.infra';
import { MemberService } from '~/member/member.service';
import { Member } from '~/member/entity/member.entity';
import { MemberImportResultDTO } from '~/member/member.dto';
import { UtilityModule } from '~/utility/utility.module';
import { StorageService } from '~/utility/storage/storage.service';

import { Tasker } from './tasker';
import { MailJob } from './mailer.tasker';

export type ImportCategory = 'member';

export class ImportJob {
  appId: string;
  invokerMemberId: string;
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
        // BullModule.registerQueue({ name: MailerTasker.name }),
        BullModule.registerQueue({ name: 'mailer' }),
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
    private readonly memberInfra: MemberInfrastructure,
    @InjectQueue('mailer') private readonly mailerQueue: Queue,
    @InjectEntityManager('phdb') private readonly entityManager: EntityManager,
  ) {
    super();
  }

  @Process()
  async process(job: Job<ImportJob>): Promise<void> {
    const { appId, invokerMemberId, category, fileInfos }: ImportJob = job.data;
    const invokers = await this.memberInfra.getMembersByConditions(
      appId, { id: invokerMemberId }, this.entityManager,
    );
    for (const fileInfo of fileInfos) {
      const { checksumETag, fileName } = fileInfo;

      try {
        const { ContentType, Body, ETag } = await this.storageService.getFileFromBucketStorage({
          Key: `${appId}/${fileName}`,
        });

        if (`"${checksumETag}"` !== ETag) {
          throw new Error('Unmatched checksum.');
        }
        const uint8Array = await Body.transformToByteArray();

        const insertResult = await this.importToDatabase(
          appId, category, ContentType, Buffer.from(uint8Array),
        );
        this.putEmailQueue(
          appId,
          invokers,
          '匯入結果(MemberImport)',
          `預計插入筆數：${insertResult.toInsertCount}</br>實際插入筆數:${insertResult.insertedCount}</br>出錯筆數:${insertResult.failedCount}`,
        );
      } catch (err) {
        console.log(err);
        this.putEmailQueue(
          appId,
          invokers,
          '匯入結果(MemberImport)：失敗',
          JSON.stringify(err),
        );
      }
    }
  }

  private importToDatabase(
    appId: string,
    category: ImportCategory,
    mimeType: string,
    rawBin: Buffer,
  ): Promise<MemberImportResultDTO> {
    let rawRows: Array<Record<string, any>> = [];
    switch (mimeType){
      case 'application/vnd.ms-excel':
        // convert excel to json
        break;
      default:
        rawRows = parse(rawBin, { columns: true, skip_empty_lines: true });
        break;
    }

    switch (category) {
      case 'member':
        return this.memberService.processImportFromFile(appId, rawRows);
    }
  }

  private async putEmailQueue(
    appId: string,
    invokerMember: Array<Member>,
    subject: string,
    content: string,
  ): Promise<void> {
    this.mailerQueue.add({
      appId,
      to: invokerMember.map(({ email }) => email),
      subject,
      cc: [],
      bcc: [],
      content: `<html>
        <body>
          ${ content }
        </body>
      </html>`
    } as MailJob);
  }
}
