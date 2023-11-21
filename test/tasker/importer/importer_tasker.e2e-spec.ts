import { v4 } from 'uuid';
import { readFileSync } from 'fs';
import { Job } from 'bull';
import { join } from 'path';
import { EntityManager, Equal, Not, Repository } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { BullModule, getQueueToken } from '@nestjs/bull';

import { AppPlan } from '~/entity/AppPlan';
import { App } from '~/app/entity/app.entity';
import { Tag } from '~/definition/entity/tag.entity';
import { Property } from '~/definition/entity/property.entity';
import { Category } from '~/definition/entity/category.entity';
import { Member } from '~/member/entity/member.entity';
import { MemberAuditLog } from '~/member/entity/member_audit_log.entity';
import { MemberCategory } from '~/member/entity/member_category.entity';
import { MemberPhone } from '~/member/entity/member_phone.entity';
import { MemberProperty } from '~/member/entity/member_property.entity';
import { MemberTag } from '~/member/entity/member_tag.entity';
import { TaskerModule } from '~/tasker/tasker.module';
import { ImportJob, ImporterTasker } from '~/tasker/importer.tasker';
import { Tasker } from '~/tasker/tasker';
import { StorageService } from '~/utility/storage/storage.service';

import { app, appPlan, category, memberTag, memberProperty } from '../../data';

describe('ImporterTasker', () => {
  let application: INestApplication;
  let mockStorageService = {
    getFileFromBucketStorage: jest.fn(),
    deleteFileAtBucketStorage: jest.fn(),
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

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TaskerModule.forRoot({
          workerName: ImporterTasker.name,
          nodeEnv: 'test',
          clazz: ImporterTasker,
        }),
      ],
    })
      .overrideProvider(StorageService)
      .useValue(mockStorageService)
      .overrideProvider(getQueueToken(ImporterTasker.name))
      .useValue(BullModule.registerQueue({ name: `Test${ImporterTasker.name}` }))
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

  afterEach(async () => {
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

  describe('Member import', () => {
    describe('Csv file', () => {
      it('Should import with skip invalid categories, properties, tags data', async () => {
        const importerTasker = application.get<ImporterTasker>(Tasker);

        mockStorageService.getFileFromBucketStorage.mockImplementationOnce(() => {
          const testDataFile = readFileSync(join(__dirname, 'test-member-import-data.csv'));
          return {
            ContentType: 'text/csv',
            Body: {
              transformToByteArray: () => testDataFile,
            },
            ETag: '"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
          };
        });

        const invoker = new Member();
        invoker.id = v4();
        invoker.app = app;
        invoker.name = 'invoker';
        invoker.username = 'invoker_account';
        invoker.email = 'invoker_email@example.com';
        invoker.role = 'general-member';
        invoker.loginedAt = new Date();

        await manager.save(invoker);

        await importerTasker.process({
          data: {
            appId: app.id,
            invokerMemberId: invoker.id,
            category: 'member',
            fileInfos: [{
              fileName: 'test-data.csv',
              checksumETag: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            }],
          },
        }  as Job<ImportJob>);
        const members = await memberRepo.find({
          where: { username: Not(Equal(invoker.username)) },
          relations:{
            memberPhones: true,
            memberCategories: true,
            memberProperties: true,
            memberTags: true,
          },
        });
        expect(members.length).toBe(2);
        const kkMember = members.find(({ name }) => name === 'KK');
        const zzMember = members.find(({ name }) => name === 'ZZ');
        const cases = {
          'name': ['KK', 'ZZ'],
          'email': ['kk@example.com', 'zz@example.com'],
          'star': ['999', '0'],
        };
        for (const key in cases) {
          expect(kkMember[key]).toBe(cases[key][0]);
          expect(zzMember[key]).toBe(cases[key][1]);
        }
        expect(['987654321', '900000000']).toContain(kkMember.memberPhones[0].phone);
        expect(['987654321', '900000000']).toContain(kkMember.memberPhones[1].phone);
        expect(zzMember.memberPhones[0].phone).toBe('912345678');
        expect(kkMember.memberCategories[0].categoryId).toBe(category.id);
        expect(zzMember.memberCategories.length).toBe(0);
        expect(kkMember.memberProperties[0].propertyId).toBe(memberProperty.id);
        expect(kkMember.memberProperties[0].value).toBe('Somet-test-value');
        expect(zzMember.memberProperties.length).toBe(0);
        expect(kkMember.memberTags.length).toBe(0);
        expect(zzMember.memberTags[0].tagName).toBe(memberTag.name);

        const auditLogs = await memberAuditLogRepo.find({});
        expect(auditLogs.length).toBe(1);
        const [auditLog] = auditLogs;
        expect(auditLog.memberId).toBe(invoker.id);
        expect(auditLog.target).toBe('test-data.csv');
        expect(auditLog.action).toBe('upload');
      });
    });

    describe('Excel file', () => {
      it('Should import with skip invalid categories, properties, tags data', async () => {
        const importerTasker = application.get<ImporterTasker>(Tasker);

        mockStorageService.getFileFromBucketStorage.mockImplementationOnce(() => {
          const testDataFile = readFileSync(join(__dirname, 'test-member-import-data.xlsx'));
          return {
            ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            Body: {
              transformToByteArray: () => testDataFile,
            },
            ETag: '"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
          };
        });

        const invoker = new Member();
        invoker.id = v4();
        invoker.app = app;
        invoker.name = 'invoker';
        invoker.username = 'invoker_account';
        invoker.email = 'invoker_email@example.com';
        invoker.role = 'general-member';
        invoker.loginedAt = new Date();

        await manager.save(invoker);

        await importerTasker.process({
          data: {
            appId: app.id,
            invokerMemberId: invoker.id,
            category: 'member',
            fileInfos: [{
              fileName: 'test-data.xlsx',
              checksumETag: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            }],
          },
        }  as Job<ImportJob>);
        const members = await memberRepo.find({
          where: { username: Not(Equal(invoker.username)) },
          relations:{
            memberPhones: true,
            memberCategories: true,
            memberProperties: true,
            memberTags: true,
          },
        });
        expect(members.length).toBe(2);
        const kkMember = members.find(({ name }) => name === 'KK');
        const zzMember = members.find(({ name }) => name === 'ZZ');
        const cases = {
          'name': ['KK', 'ZZ'],
          'email': ['kk@example.com', 'zz@example.com'],
          'star': ['999', '0'],
        };
        for (const key in cases) {
          expect(kkMember[key]).toBe(cases[key][0]);
          expect(zzMember[key]).toBe(cases[key][1]);
        }
        expect(['987654321', '900000000']).toContain(kkMember.memberPhones[0].phone);
        expect(['987654321', '900000000']).toContain(kkMember.memberPhones[1].phone);
        expect(zzMember.memberPhones[0].phone).toBe('912345678');
        expect(kkMember.memberCategories[0].categoryId).toBe(category.id);
        expect(zzMember.memberCategories.length).toBe(0);
        expect(kkMember.memberProperties[0].propertyId).toBe(memberProperty.id);
        expect(kkMember.memberProperties[0].value).toBe('Somet-test-value');
        expect(zzMember.memberProperties.length).toBe(0);
        expect(kkMember.memberTags.length).toBe(0);
        expect(zzMember.memberTags[0].tagName).toBe(memberTag.name);

        const auditLogs = await memberAuditLogRepo.find({});
        expect(auditLogs.length).toBe(1);
        const [auditLog] = auditLogs;
        expect(auditLog.memberId).toBe(invoker.id);
        expect(auditLog.target).toBe('test-data.xlsx');
        expect(auditLog.action).toBe('upload');
      });
    });
  });
});
