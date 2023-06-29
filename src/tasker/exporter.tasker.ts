import dayjs from 'dayjs';
import { Job, Queue } from 'bull';
import * as XLSX from 'xlsx';
import { EntityManager } from 'typeorm';
import { BullModule, InjectQueue, Process, Processor } from '@nestjs/bull';
import { DynamicModule, Logger } from '@nestjs/common';
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
  exportMime?: string;
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
    protected readonly logger: Logger,
    private readonly storageService: StorageService,
    private readonly memberService: MemberService,
    private readonly memberInfra: MemberInfrastructure,
    // @InjectQueue(MailerTasker.name) private readonly mailerQueue: Queue,
    @InjectQueue('mailer') private readonly mailerQueue: Queue,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {
    super(logger);
  }

  @Process()
  async process(job: Job<ExportJob>): Promise<void> {
    this.preProcess();
    try {
      const { id } = job;
      this.logger.log(`Export task: ${id} processing.`);

      const { appId, invokerMemberId, category, exportMime }: ExportJob = job.data;
      const { raw, ext } = await this.exportFromDatabase(appId, job.data);
      const invokers = await this.memberInfra.getMembersByConditions(
        appId, { id: invokerMemberId }, this.entityManager,
      );
      const admins = await this.memberInfra.getMembersByConditions(
        appId, { role: 'app-owner' }, this.entityManager,
      );

      const fileKey = `${appId}/${category}_export_${dayjs.utc().format('YYYY-MM-DDTHH:mm:ss')}.${ext}`;
      const { ETag } = await this.storageService.saveFilesInBucketStorage({
        Key: fileKey,
        Body: raw,
        ContentType: exportMime,
      });
      this.logger.log(`[File]: ${fileKey} saved with ETag: ${ETag} into S3.`);

      const signedDownloadUrl = await this.storageService
        .getSignedUrlForDownloadStorage(fileKey, 7 * 24 * 60 * 60);
      this.putEmailQueue(
        appId,
        [...invokers, ...admins],
        '匯出結果(MemberExport)',
        `檔案下載連結: ${signedDownloadUrl}</br>請在24小時內下載，逾時連結將失效。`,
      );
      this.logger.log(`Export task: ${id} completed.`);
    } catch (error) {
      this.logger.error('Export task error:');
      this.logger.error(error);
    } finally {
      this.postProcess();
    }
  }

  private async exportFromDatabase(appId: string, data: ExportJob): Promise<{ raw: any; ext: string; }> {
    let rawRows: Array<Record<string, any>> = [];
    switch (data.category) {
      case 'member':
        const { memberIds } = data as MemberExportJob;
        rawRows = await this.memberService.processExportFromDatabase(appId, memberIds);
        break;
    }

    return this.writeToFile(rawRows, data.exportMime);
  }

  private writeToFile(rawRows: Array<Record<string, any>>, mimeType?: string): { raw: any; ext: string; } {
    const newBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newBook, XLSX.utils.json_to_sheet(rawRows));

    switch (mimeType) {
      case 'text/csv':
        return {
          raw: XLSX.write(newBook, { type: 'buffer', bookType: 'csv' }),
          ext: 'csv',
        };
      default:
        return {
          raw: XLSX.write(newBook, { type: 'buffer', bookType: 'xlsx' }),
          ext: 'xlsx',
        };
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
