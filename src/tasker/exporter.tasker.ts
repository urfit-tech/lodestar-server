import dayjs from 'dayjs';
import { Job, Queue } from 'bull';
import { stringify } from 'csv-stringify/sync';
import { EntityManager } from 'typeorm';
import { BullModule, InjectQueue, Process, Processor } from '@nestjs/bull';
import { DynamicModule } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { DefinitionModule } from '~/definition/definition.module';
import { Member } from '~/member/entity/member.entity';
import { MemberService } from '~/member/member.service';
import { MemberInfrastructure } from '~/member/member.infra';
import { StorageService } from '~/utility/storage/storage.service';

import { Tasker } from './tasker';
import { MailJob } from './mailer.tasker';

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
      imports: [
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
    // @InjectQueue(MailerTasker.name) private readonly mailerQueue: Queue,
    @InjectQueue('mailer') private readonly mailerQueue: Queue,
    @InjectEntityManager('phdb') private readonly entityManager: EntityManager,
  ) {
    super();
  }

  @Process()
  async process(job: Job<ExportJob>): Promise<void> {
    const { appId, invokerMemberId, category }: ExportJob = job.data;
    const csvRawData = await this.exportFromDatabase(appId, job.data);
    const invokers = await this.memberInfra.getMembersByConditions(
      appId, { id: invokerMemberId }, this.entityManager,
    );

    const fileKey = `${appId}/${category}_export_${dayjs.utc().format('YYYY-MM-DDTHH:mm:ss')}`;
    const result = await this.storageService.saveFilesInBucketStorage({
      Key: fileKey,
      Body: csvRawData,
      ContentType: 'text/csv',
    });

    const signedDownloadUrl = await this.storageService
      .getSignedUrlForDownloadStorage(fileKey, 24 * 60 * 60);
    this.putEmailQueue(
      appId,
      invokers,
      '匯出結果(MemberExport)',
      `檔案下載連結: ${signedDownloadUrl}</br>請在24小時內下載，逾時連結將失效。`,
    );
  }

  private async exportFromDatabase(appId: string, data: ExportJob) {
    let rawRows: Array<Record<string, any>> = [];
    switch (data.category) {
      case 'member':
        const { memberIds } = data as MemberExportJob;
        rawRows = await this.memberService.processExportFromDatabase(appId, memberIds);
        break;
    }

    return stringify(rawRows, {
      header: true,
      columns: Object.keys(rawRows[0]),
    });
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
