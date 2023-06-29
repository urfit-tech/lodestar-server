import { Job } from 'bull';
import { v4 } from 'uuid';
import * as XLSX from 'xlsx';
import { EntityManager, Repository } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { AppPlan } from '~/entity/AppPlan';
import { App } from '~/entity/App';
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
import { TaskerModule } from '~/tasker/tasker.module';
import { ExporterTasker, MemberExportJob } from '~/tasker/exporter.tasker';
import { Tasker } from '~/tasker/tasker';

import { app, appPlan, category, memberProperty, memberTag } from '../../data';

describe('ExporterTasker', () => {
  let application: INestApplication;
  let mockStorageService = {
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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TaskerModule.forRoot({
          workerName: ExporterTasker.name,
          nodeEnv: 'test',
          clazz: ExporterTasker,
        }),
      ],
    })
      .overrideProvider(StorageService).useValue(mockStorageService)
      .compile();
    
    application = moduleFixture.createNestApplication();

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

    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await categoryRepo.save(category);
    await propertyRepo.save(memberProperty);
    await tagRepo.save(memberTag);

    await application.init();
  });

  afterAll(async () => {
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

    await application.close();
  });

  it('Should upload file with proper format', async () => {
    const exporterTasker = application.get<ExporterTasker>(Tasker);
    let savedKey: string;
    let savedFile: string;
    
    mockStorageService.saveFilesInBucketStorage.mockImplementationOnce((awsPayload: {
      Key: string;
      Body: string;
      ContentType: string;
    }) => {
      savedKey = awsPayload.Key;
      savedFile = awsPayload.Body;
      return {
        ETag: '"someETag"',
        ServerSideEncryption: 'AES256',
      };
    });
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
        memberIds: [
          testMember.id,
        ],
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
});
