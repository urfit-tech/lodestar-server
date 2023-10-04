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
import { OrderService } from '~/order/order.service';
import { OrderInfrastructure } from '~/order/order.infra';
import { CouponInfrastructure } from '~/coupon/coupon.infra';
import { PaymentInfrastructure } from '~/payment/payment.infra';
import { OrderExportDTO } from '~/order/order.dto';
import { SharingCodeInfrastructure } from '~/sharingCode/sharingCode.infra';
import { ProductInfrastructure } from '~/product/product.infra';
import { EmailService } from '~/mailer/email/email.service';
import { AppInfrastructure } from '~/app/app.infra';
import { VoucherInfrastructure } from '~/voucher/voucher.infra';

export type ExportCategory = 'member' | 'orderLog' | 'orderProduct' | 'orderDiscount';

export interface ExportJob {
  appId: string;
  invokerMemberId: string;
  category: ExportCategory;
  exportMime?: string;
}

export type MemberExportJob = ExportJob & {
  category: 'member';
  memberIds: Array<string>;
};

export type OrderLogExportJob = ExportJob & {
  category: 'orderLog';
  conditions: OrderExportDTO;
};

export type OrderProductExportJob = ExportJob & {
  category: 'orderProduct';
  conditions: OrderExportDTO;
};

export type OrderDiscountExportJob = ExportJob & {
  category: 'orderDiscount';
  conditions: OrderExportDTO;
};

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
        EmailService,
        AppInfrastructure,
        MemberInfrastructure,
        OrderService,
        OrderInfrastructure,
        CouponInfrastructure,
        AppInfrastructure,
        VoucherInfrastructure,
        PaymentInfrastructure,
        SharingCodeInfrastructure,
        ProductInfrastructure,
      ],
    };
  }

  constructor(
    protected readonly logger: Logger,
    private readonly storageService: StorageService,
    private readonly memberService: MemberService,
    private readonly mailService: EmailService,
    private readonly orderService: OrderService,
    private readonly memberInfra: MemberInfrastructure,
    private readonly appInfra: AppInfrastructure,
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
        appId,
        { id: invokerMemberId },
        this.entityManager,
      );
      const appSettings = await this.appInfra.getAppSettings(appId, this.entityManager);
      const exportToAllAdmin = appSettings.find((setting) => setting.key === 'export.to_all_admins')?.value;
      let admins = [];
      if (exportToAllAdmin === '1') {
        admins = await this.memberInfra.getMembersByConditions(appId, { role: 'app-owner' }, this.entityManager);
      }

      const fileKey = `${appId}/${category}_export_${dayjs.utc().format('YYYY-MM-DDTHH:mm:ss')}.${ext}`;
      const { ETag } = await this.storageService.saveFilesInBucketStorage({
        Key: fileKey,
        Body: raw,
        ContentType: exportMime,
      });
      this.logger.log(`[File]: ${fileKey} saved with ETag: ${ETag} into S3.`);

      const signedDownloadUrl = await this.storageService.getSignedUrlForDownloadStorage(fileKey, 7 * 24 * 60 * 60);

      await this.memberInfra.insertMemberAuditLog(invokers, signedDownloadUrl, 'download', this.entityManager);

      let subject;
      switch (job.data.category) {
        case 'member':
          subject = '會員匯出結果';
          break;
        case 'orderLog':
          subject = '訂單匯出結果';
          break;
        case 'orderProduct':
          subject = '訂單產品匯出結果';
          break;
        case 'orderDiscount':
          subject = '訂單折扣匯出結果';
          break;
      }
      const partial = { url: signedDownloadUrl, title: subject };
      await this.putEmailQueue(appId, partial, subject, [...invokers, ...admins], this.entityManager);

      this.logger.log(`Export task: ${id} completed.`);
    } catch (error) {
      this.logger.error('Export task error:');
      this.logger.error(error);
    } finally {
      this.postProcess();
    }
  }

  private async exportFromDatabase(appId: string, data: ExportJob): Promise<{ raw: any; ext: string }> {
    let rawRows: Array<Record<string, any>> = [];
    switch (data.category) {
      case 'member':
        const { memberIds } = data as MemberExportJob;
        rawRows = await this.memberService.processExportFromDatabase(appId, memberIds);
        break;
      case 'orderLog':
        const { conditions: orderLogConditions } = data as OrderLogExportJob;
        rawRows = await this.orderService.processOrderLogExportFromDatabase(appId, orderLogConditions);
        break;
      case 'orderProduct':
        const { conditions: orderProductConditions } = data as OrderProductExportJob;
        rawRows = await this.orderService.processOrderProductExportFromDatabase(appId, orderProductConditions);
        break;
      case 'orderDiscount':
        const { conditions: orderDiscountConditions } = data as OrderProductExportJob;
        rawRows = await this.orderService.processOrderDiscountExportFromDatabase(appId, orderDiscountConditions);
        break;
    }

    return this.writeToFile(rawRows, data.exportMime);
  }

  private writeToFile(rawRows: Array<Record<string, any>>, mimeType?: string): { raw: any; ext: string } {
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
    partials: Record<string, string>,
    subject: string,
    invokerMember: Array<Member>,
    manager: EntityManager,
  ): Promise<void> {
    await this.mailService.insertEmailJobIntoQueue({
      appId,
      catalog: 'export',
      targetMemberIds: invokerMember.map((member) => member.id),
      partials,
      subject,
      manager,
    });
  }
}
