import { Job } from 'bull';
import { v4 } from 'uuid';
import * as XLSX from 'xlsx';
import { EntityManager, Repository } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { AppPlan } from '~/entity/AppPlan';
import { App } from '~/app/entity/app.entity';
import { Category } from '~/definition/entity/category.entity';
import { Property } from '~/definition/entity/property.entity';
import { Tag } from '~/definition/entity/tag.entity';
import { MemberPhone } from '~/member/entity/member_phone.entity';
import { MemberCategory } from '~/member/entity/member_category.entity';
import { MemberProperty } from '~/member/entity/member_property.entity';
import { MemberTag } from '~/member/entity/member_tag.entity';
import { Member } from '~/member/entity/member.entity';
import { MemberAuditLog } from '~/member/entity/member_audit_log.entity';
import { StorageService } from '~/utility/storage/storage.service';
import { CacheService } from '~/utility/cache/cache.service';
import { TaskerModule } from '~/tasker/tasker.module';
import { ExporterTasker, MemberExportJob, OrderLogExportJob } from '~/tasker/exporter.tasker';
import { Tasker } from '~/tasker/tasker';

import { app, appPlan, category, memberProperty, memberTag } from '../../data';
import { OrderLog } from '~/order/entity/order_log.entity';
import { OrderProduct } from '~/order/entity/order_product.entity';
import { Product } from '~/entity/Product';

describe('ExporterTasker', () => {
  let application: INestApplication;
  let cacheService: CacheService;
  const mockStorageService = {
    saveFilesInBucketStorage: jest.fn(),
    getSignedUrlForDownloadStorage: jest.fn(),
  };

  let manager: EntityManager;
  let memberPhoneRepo: Repository<MemberPhone>;
  let memberCategoryRepo: Repository<MemberCategory>;
  let memberPropertyRepo: Repository<MemberProperty>;
  let memberTagRepo: Repository<MemberTag>;
  let memberRepo: Repository<Member>;
  let memberAuditLogRepo: Repository<MemberAuditLog>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let categoryRepo: Repository<Category>;
  let propertyRepo: Repository<Property>;
  let tagRepo: Repository<Tag>;
  let orderRepo: Repository<OrderLog>;
  let orderProductRepo: Repository<OrderProduct>;
  let productRepo: Repository<Product>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TaskerModule.forRoot({
          workerName: ExporterTasker.name,
          nodeEnv: 'test',
          clazz: ExporterTasker,
        }),
      ],
    })
      .overrideProvider(StorageService)
      .useValue(mockStorageService)
      .compile();

    application = moduleFixture.createNestApplication();
    cacheService = application.get(CacheService);

    manager = application.get<EntityManager>(getEntityManagerToken());
    memberPhoneRepo = manager.getRepository(MemberPhone);
    memberCategoryRepo = manager.getRepository(MemberCategory);
    memberPropertyRepo = manager.getRepository(MemberProperty);
    memberTagRepo = manager.getRepository(MemberTag);
    memberRepo = manager.getRepository(Member);
    memberAuditLogRepo = manager.getRepository(MemberAuditLog);
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    categoryRepo = manager.getRepository(Category);
    propertyRepo = manager.getRepository(Property);
    tagRepo = manager.getRepository(Tag);
    orderRepo = manager.getRepository(OrderLog);
    orderProductRepo = manager.getRepository(OrderProduct);
    productRepo = manager.getRepository(Product);

    await productRepo.delete({});
    await orderProductRepo.delete({});
    await orderRepo.delete({});
    await memberPhoneRepo.delete({});
    await memberCategoryRepo.delete({});
    await memberPropertyRepo.delete({});
    await memberTagRepo.delete({});
    await memberRepo.delete({});
    await memberAuditLogRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await categoryRepo.delete({});
    await propertyRepo.delete({});
    await tagRepo.delete({});
    await cacheService.getClient().flushall();

    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await categoryRepo.save(category);
    await propertyRepo.save(memberProperty);
    await tagRepo.save(memberTag);

    await application.init();
  });

  afterEach(async () => {
    await orderProductRepo.delete({});
    await orderRepo.delete({});
    await memberPhoneRepo.delete({});
    await memberCategoryRepo.delete({});
    await memberPropertyRepo.delete({});
    await memberTagRepo.delete({});
    await memberRepo.delete({});
    await memberAuditLogRepo.delete({});
    await categoryRepo.delete({});
    await propertyRepo.delete({});
    await tagRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await cacheService.getClient().flushall();

    await application.close();
  });

  it('Should upload member csv file with proper format', async () => {
    const exporterTasker = application.get<ExporterTasker>(Tasker);
    let savedKey: string;
    let savedFile: string;

    mockStorageService.saveFilesInBucketStorage.mockImplementationOnce(
      (awsPayload: { Key: string; Body: string; ContentType: string }) => {
        savedKey = awsPayload.Key;
        savedFile = awsPayload.Body;
        return {
          ETag: '"someETag"',
          ServerSideEncryption: 'AES256',
        };
      },
    );
    mockStorageService.getSignedUrlForDownloadStorage.mockImplementationOnce(() => {
      return 'someUrl';
    });

    const invoker = new Member();
    invoker.id = v4();
    invoker.app = app;
    invoker.name = 'invoker';
    invoker.username = 'invoker_account';
    invoker.email = 'invoker_email@example.com';
    invoker.role = 'general-member';
    invoker.loginedAt = new Date();

    const testMember = new Member();
    testMember.id = v4();
    testMember.app = app;
    testMember.name = 'John';
    testMember.username = 'john_account';
    testMember.email = 'john@example.com';
    testMember.role = 'general-member';
    testMember.loginedAt = new Date();

    await manager.save([invoker, testMember]);

    await exporterTasker.process({
      data: {
        appId: app.id,
        category: 'member',
        invokerMemberId: invoker.id,
        memberIds: [testMember.id],
        exportMime: 'text/csv',
      },
    } as Job<MemberExportJob>);
    const { Sheets, SheetNames } = XLSX.read(savedFile);
    const parsed = XLSX.utils.sheet_to_json(Sheets[SheetNames[0]], { defval: '' });
    expect(parsed.length).toBe(2);
    const [_, data] = parsed;
    expect(data['流水號']).toBe(testMember.id);
    expect(data['姓名']).toBe(testMember.name);
    expect(data['帳號']).toBe(testMember.username);
    expect(data['信箱']).toBe(testMember.email);

    const auditLogs = await memberAuditLogRepo.find({});
    expect(auditLogs.length).toBe(1);
    const [auditLog] = auditLogs;
    expect(auditLog.memberId).toBe(invoker.id);
    expect(auditLog.target).toBe('someUrl');
    expect(auditLog.action).toBe('download');
  });

  it('Should upload orderLog csv file with proper format', async () => {
    const exporterTasker = application.get<ExporterTasker>(Tasker);
    let savedKey: string;
    let savedFile: string;

    mockStorageService.saveFilesInBucketStorage.mockImplementationOnce(
      (awsPayload: { Key: string; Body: string; ContentType: string }) => {
        savedKey = awsPayload.Key;
        savedFile = awsPayload.Body;
        return {
          ETag: '"someETag"',
          ServerSideEncryption: 'AES256',
        };
      },
    );
    mockStorageService.getSignedUrlForDownloadStorage.mockImplementationOnce(() => {
      return 'someUrl';
    });

    const invoker = new Member();
    invoker.id = v4();
    invoker.app = app;
    invoker.name = 'invoker';
    invoker.username = 'invoker_account';
    invoker.email = 'invoker_email@example.com';
    invoker.role = 'general-member';
    invoker.loginedAt = new Date();

    const testMember = new Member();
    testMember.id = v4();
    testMember.app = app;
    testMember.name = 'John';
    testMember.username = 'john_account';
    testMember.email = 'john@example.com';
    testMember.role = 'general-member';
    testMember.loginedAt = new Date();

    const orderLog = new OrderLog();
    orderLog.appId = app.id;
    orderLog.member = testMember;
    orderLog.createdAt = new Date();
    orderLog.invoiceOptions = {};
    orderLog.status = 'SUCCESS';

    await manager.save([invoker, testMember, orderLog]);

    await exporterTasker.process({
      data: {
        appId: app.id,
        category: 'orderLog',
        invokerMemberId: invoker.id,
        conditions: { statuses: ['SUCCESS'] },
        exportMime: 'text/csv',
      },
    } as Job<OrderLogExportJob>);
    const { Sheets, SheetNames } = XLSX.read(savedFile);
    const parsed = XLSX.utils.sheet_to_json(Sheets[SheetNames[0]], { defval: '' });
    expect(parsed.length).toBe(2);

    const [, data] = parsed;
    expect(data['訂單狀態']).toBe('SUCCESS');
    expect(data['會員姓名']).toBe(`${testMember.name}(${testMember.username})`);
    expect(data['會員信箱']).toBe(testMember.email);

    const auditLogs = await memberAuditLogRepo.find({});
    expect(auditLogs.length).toBe(1);
    const [auditLog] = auditLogs;
    expect(auditLog.memberId).toBe(invoker.id);
    expect(auditLog.target).toBe('someUrl');
    expect(auditLog.action).toBe('download');
  });
});
