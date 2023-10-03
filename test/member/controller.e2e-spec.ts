import jwt from 'jsonwebtoken';
import { v4 } from 'uuid';
import { Queue } from 'bull';
import { EntityManager, Repository } from 'typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';
import request from 'supertest';

import { ApplicationModule } from '~/application.module';
import { ApiExceptionFilter } from '~/api.filter';
import { ImporterTasker } from '~/tasker/importer.tasker';
import { ExporterTasker } from '~/tasker/exporter.tasker';
import { AppPlan } from '~/entity/AppPlan';
import { App } from '~/app/entity/app.entity';
import { AppHost } from '~/app/entity/app_host.entity';
import { Member } from '~/member/entity/member.entity';
import { MemberGetResultDTO } from '~/member/member.dto';

import { Property } from '~/definition/entity/property.entity';
import { MemberProperty } from '~/member/entity/member_property.entity';
import { MemberTag } from '~/member/entity/member_tag.entity';
import { Tag } from '~/definition/entity/tag.entity';
import { MemberPhone } from '~/member/entity/member_phone.entity';
import { Category } from '~/definition/entity/category.entity';
import { MemberCategory } from '~/member/entity/member_category.entity';
import { PermissionGroup } from '~/entity/PermissionGroup';
import { MemberPermissionGroup } from '~/member/entity/member_permission_group.entity';

import { app, appHost, appPlan, memberProperty } from '../data';

describe('MemberController (e2e)', () => {
  let application: INestApplication;

  let manager: EntityManager;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appHostRepo: Repository<AppHost>;
  let memberRepo: Repository<Member>;
  let propertyRepo: Repository<Property>;
  let tagRepo: Repository<Tag>;
  let categoryRepo: Repository<Category>;
  let permissionGroupRepo: Repository<PermissionGroup>;
  let memberCategoryRepo: Repository<MemberCategory>;
  let memberPropertyRepo: Repository<MemberProperty>;
  let memberTagRepo: Repository<MemberTag>;
  let memberPhoneRepo: Repository<MemberPhone>;
  let memberPermissionGroupRepo: Repository<MemberPermissionGroup>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture.createNestApplication();

    application.useGlobalPipes(new ValidationPipe()).useGlobalFilters(new ApiExceptionFilter());

    manager = application.get<EntityManager>(getEntityManagerToken());
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    appHostRepo = manager.getRepository(AppHost);
    memberRepo = manager.getRepository(Member);
    propertyRepo = manager.getRepository(Property);
    tagRepo = manager.getRepository(Tag);
    categoryRepo = manager.getRepository(Category);
    permissionGroupRepo = manager.getRepository(PermissionGroup);
    memberPropertyRepo = manager.getRepository(MemberProperty);
    memberTagRepo = manager.getRepository(MemberTag);
    memberPhoneRepo = manager.getRepository(MemberPhone);
    memberCategoryRepo = manager.getRepository(MemberCategory);
    memberPermissionGroupRepo = manager.getRepository(MemberPermissionGroup);

    await memberPermissionGroupRepo.delete({});
    await memberPhoneRepo.delete({});
    await memberTagRepo.delete({});
    await memberPropertyRepo.delete({});
    await memberCategoryRepo.delete({});
    await memberRepo.delete({});
    await propertyRepo.delete({});
    await tagRepo.delete({});
    await categoryRepo.delete({});
    await permissionGroupRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});

    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await appHostRepo.save(appHost);

    await application.init();
  });

  afterEach(async () => {
    await memberPermissionGroupRepo.delete({});
    await memberPhoneRepo.delete({});
    await memberPropertyRepo.delete({});
    await memberTagRepo.delete({});
    await memberCategoryRepo.delete({});
    await memberRepo.delete({});
    await propertyRepo.delete({});
    await tagRepo.delete({});
    await categoryRepo.delete({});
    await permissionGroupRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});

    await application.close();
  });

  describe('/members (GET)', () => {
    const route = '/members';

    it('Should raise unauthorized exception due to incorrect token', async () => {
      await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer something`)
        .set('host', appHost.host)
        .send({
          appId: app.id,
          fileInfos: [],
        })
        .expect(401);
    });

    it('Should raise unauthorized exception due to missing permission', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          memberId: 'invoker_member_id',
          permissions: [],
        },
        jwtSecret,
      );
      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({})
        .expect(401);
      expect(res.body.message).toBe('missing required permission');
    });

    it('Should raise error due to incorrect payload of nextToken & prevToken', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: [],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          option: {
            nextToken: '123',
            prevToken: '456',
          },
        })
        .expect(400);
      expect(res.body.message).toBe('nextToken & prevToken cannot appear in the same request.');
    });

    it('Should get members with empty conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({})
        .expect(200);
      const { data: fetched }: MemberGetResultDTO = res.body;
      const names = fetched.map(({ name }) => name);

      expect(names.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        expect(names.includes(`name${0}`)).toBeTruthy();
      }
    });

    it('Should get members with name conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: { name: '%name%' },
        })
        .expect(200);
      const { data: fetched }: MemberGetResultDTO = res.body;
      const names = fetched.map(({ name }) => name);

      expect(names.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        expect(names.includes(`name${0}`)).toBeTruthy();
      }
    });

    it('Should get members with managerName conditions', async () => {
      const managerMember = new Member();
      managerMember.appId = app.id;
      managerMember.id = v4();
      managerMember.name = 'manager_name';
      managerMember.username = 'manager_username';
      managerMember.email = 'manager_email@example.com';
      managerMember.role = 'general-member';
      managerMember.star = 0;
      managerMember.createdAt = new Date();
      managerMember.loginedAt = new Date();
      await manager.save(managerMember);

      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        insertedMember.manager = managerMember;
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: { managerName: `%${managerMember.name}%` },
        })
        .expect(200);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        const member = fetched[i];
        expect(member.manager_id).toBe(managerMember.id);
      }
    });

    it('Should get members with partial email conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: { email: '%example.com%' },
        })
        .expect(200);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        expect(fetched[i].name.includes(`name${fetched.length - i}`)).toBeTruthy();
        expect(fetched[i].email.includes(`example.com`)).toBeTruthy();
      }
    });

    it('Should get empty members with nested not matched conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            name: '%name%',
            username: '%unable-to-match-condition%',
          },
        })
        .expect(200);
      const { data }: MemberGetResultDTO = res.body;
      expect(data.length).toBe(0);
    });

    it('Should get members with matched nested conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            name: '%name%',
            username: '%user%',
          },
        })
        .expect(200);
      const { data: fetched }: MemberGetResultDTO = res.body;
      const names = fetched.map(({ name }) => name);

      expect(names.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        expect(names.includes(`name${0}`)).toBeTruthy();
      }
    });

    it('Should get members with matched nested conditions & pagination', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date(new Date().getTime() + i * 1000);
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      let res, data, cursor;
      const names = [];
      do {
        const option = {
          limit: 2,
          ...(cursor && cursor.afterCursor && { nextToken: cursor.afterCursor }),
        };
        res = await request(application.getHttpServer())
          .get(route)
          .set('Authorization', `Bearer ${token}`)
          .set('host', appHost.host)
          .send({
            option,
            condition: {
              name: '%name%',
              username: '%user%',
            },
          })
          .expect(200);
        ({ data, cursor } = res.body);
        expect(data.length).not.toBe(0);
        data.forEach(({ name }) => names.push(name));
      } while (cursor !== null && cursor.afterCursor !== null);
      expect(names).toMatchObject(['name4', 'name3', 'name2', 'name1', 'name0']);
    });
  });

  describe('/members (POST) deprecated soon', () => {
    const route = '/members';

    it('Should raise unauthorized exception due to incorrect token', async () => {
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer something`)
        .set('host', appHost.host)
        .send({
          appId: app.id,
          fileInfos: [],
        })
        .expect(401);
    });

    it('Should raise unauthorized exception due to missing permission', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          memberId: 'invoker_member_id',
          permissions: [],
        },
        jwtSecret,
      );
      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({})
        .expect(401);
      expect(res.body.message).toBe('missing required permission');
    });

    it('Should raise error due to incorrect payload of nextToken & prevToken', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: [],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          option: {
            nextToken: '123',
            prevToken: '456',
          },
        })
        .expect(400);
      expect(res.body.message).toBe('nextToken & prevToken cannot appear in the same request.');
    });

    it('Should get members with empty conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({})
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;
      const names = fetched.map(({ name }) => name);

      expect(names.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        expect(names.includes(`name${0}`)).toBeTruthy();
      }
    });

    it('Should get members with name conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: { name: '%name%' },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;
      const names = fetched.map(({ name }) => name);

      expect(names.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        expect(names.includes(`name${0}`)).toBeTruthy();
      }
    });

    it('Should get members with manager conditions', async () => {
      const managerMember = new Member();
      managerMember.appId = app.id;
      managerMember.id = v4();
      managerMember.name = 'manager_name';
      managerMember.username = 'manager_username';
      managerMember.email = 'manager_email@example.com';
      managerMember.role = 'general-member';
      managerMember.star = 0;
      managerMember.createdAt = new Date();
      managerMember.loginedAt = new Date();
      await manager.save(managerMember);

      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        insertedMember.manager = managerMember;
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: { managerName: `%${managerMember.name}%` },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        const member = fetched[i];
        expect(member.manager_id).toBe(managerMember.id);
      }
    });

    it('Should get single member with full member property condition', async () => {
      const { id: propertyId } = await manager.save(memberProperty);

      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedMemberProperty = new MemberProperty();
        insertedMemberProperty.id = v4();
        insertedMemberProperty.memberId = memberId;
        insertedMemberProperty.propertyId = propertyId;
        insertedMemberProperty.value = `test member property value ${i}`;
        await manager.save(insertedMemberProperty);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            properties: [
              {
                [propertyId]: '%test member property value 1%',
              },
            ],
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(1);
    });

    it('Should get members with partial member property condition', async () => {
      const { id: propertyId } = await manager.save(memberProperty);

      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedMemberProperty = new MemberProperty();
        insertedMemberProperty.id = v4();
        insertedMemberProperty.memberId = memberId;
        insertedMemberProperty.propertyId = propertyId;
        insertedMemberProperty.value = `test member property value ${i}`;
        await manager.save(insertedMemberProperty);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            properties: [
              {
                [propertyId]: '%test member property value%',
              },
            ],
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(5);
    });

    it('Should get single member with member phone condition', async () => {
      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedMemberPhone = new MemberPhone();
        insertedMemberPhone.id = v4();
        insertedMemberPhone.memberId = memberId;
        insertedMemberPhone.phone = `0900000000${i}`;
        await manager.save(insertedMemberPhone);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            phone: '%09000000001%',
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(1);
    });

    it('Should get members with partial member phone condition', async () => {
      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedMemberPhone = new MemberPhone();
        insertedMemberPhone.id = v4();
        insertedMemberPhone.memberId = memberId;
        insertedMemberPhone.phone = `0900000000${i}`;
        await manager.save(insertedMemberPhone);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            phone: '%0000%',
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(5);
    });

    it('Should get single member with member tag condition', async () => {
      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedTag = new Tag();
        insertedTag.name = `tag ${i}`;
        insertedTag.type = 'member';
        await manager.save(insertedTag);

        const insertedMemberTag = new MemberTag();
        insertedMemberTag.id = v4();
        insertedMemberTag.memberId = memberId;
        insertedMemberTag.tagName = insertedTag.name;
        await manager.save(insertedMemberTag);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            tag: '%tag 1%',
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(1);
    });

    it('Should get members with member partial tag condition', async () => {
      const insertedTag = new Tag();
      insertedTag.name = `tag`;
      insertedTag.type = 'member';
      const { name: tagName } = await manager.save(insertedTag);

      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedMemberTag = new MemberTag();
        insertedMemberTag.id = v4();
        insertedMemberTag.memberId = memberId;
        insertedMemberTag.tagName = tagName;
        await manager.save(insertedMemberTag);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            tag: '%tag%',
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(5);
    });

    it('Should get single member with member category condition', async () => {
      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedCategory = new Category();
        insertedCategory.name = `category ${i}`;
        insertedCategory.class = 'member';
        insertedCategory.position = 0;
        insertedCategory.appId = app.id;
        const { id: categoryId } = await manager.save(insertedCategory);

        const insertedMemberCategory = new MemberCategory();
        insertedMemberCategory.id = v4();
        insertedMemberCategory.memberId = memberId;
        insertedMemberCategory.categoryId = categoryId;
        insertedMemberCategory.position = 0;
        await manager.save(insertedMemberCategory);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            category: '%category 1%',
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(1);
    });

    it('Should get single member with member category condition', async () => {
      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedCategory = new Category();
        insertedCategory.name = `category ${i}`;
        insertedCategory.class = 'member';
        insertedCategory.position = 0;
        insertedCategory.appId = app.id;
        const { id: categoryId } = await manager.save(insertedCategory);

        const insertedMemberCategory = new MemberCategory();
        insertedMemberCategory.id = v4();
        insertedMemberCategory.memberId = memberId;
        insertedMemberCategory.categoryId = categoryId;
        insertedMemberCategory.position = 0;
        await manager.save(insertedMemberCategory);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            category: '%category%',
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(5);
    });

    it('Should get single member with member permission group condition', async () => {
      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedPermissionGroup = new PermissionGroup();
        insertedPermissionGroup.name = `test permission group ${i}`;
        insertedPermissionGroup.appId = app.id;
        const { id: permissionGroupId } = await manager.save(insertedPermissionGroup);

        const insertedMemberPermissionGroup = new MemberPermissionGroup();
        insertedMemberPermissionGroup.id = v4();
        insertedMemberPermissionGroup.memberId = memberId;
        insertedMemberPermissionGroup.permissionGroupId = permissionGroupId;
        await manager.save(insertedMemberPermissionGroup);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            permissionGroup: 'test permission group 1',
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(1);
    });

    it('Should get empty members with nested not matched conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            name: '%name%',
            username: '%unable-to-match-condition%',
          },
        })
        .expect(201);
      const { data }: MemberGetResultDTO = res.body;
      expect(data.length).toBe(0);
    });

    it('Should get members with matched nested conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            name: '%name%',
            username: '%user%',
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;
      const names = fetched.map(({ name }) => name);

      expect(names.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        expect(names.includes(`name${0}`)).toBeTruthy();
      }
    });

    it('Should get members with matched nested conditions & pagination', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date(new Date().getTime() + i * 1000);
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      let res, data, cursor;
      const names = [];
      do {
        const option = {
          limit: 2,
          ...(cursor && cursor.afterCursor && { nextToken: cursor.afterCursor }),
        };
        res = await request(application.getHttpServer())
          .post(route)
          .set('Authorization', `Bearer ${token}`)
          .set('host', appHost.host)
          .send({
            option,
            condition: {
              name: '%name%',
              username: '%user%',
            },
          })
          .expect(201);
        ({ data, cursor } = res.body);
        expect(data.length).not.toBe(0);
        data.forEach(({ name }) => names.push(name));
      } while (cursor !== null && cursor.afterCursor !== null);
      expect(names).toMatchObject(['name4', 'name3', 'name2', 'name1', 'name0']);
    });
  });

  describe('/members/import (POST)', () => {
    const route = '/members/import';

    it('Should raise unauthorized exception', async () => {
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer something`)
        .set('host', appHost.host)
        .send({
          appId: app.id,
          fileInfos: [],
        })
        .expect(401);
    });

    it('Should raise bad request exception', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          memberId: 'invoker_member_id',
        },
        jwtSecret,
      );
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({})
        .expect(400);
    });

    it('Should insert job into queue', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');
      const importerQueue = application.get<Queue>(getQueueToken(ImporterTasker.name));
      await importerQueue.empty();

      const token = jwt.sign(
        {
          memberId: 'invoker_member_id',
        },
        jwtSecret,
      );
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          appId: app.id,
          fileInfos: [
            {
              key: 'some_key',
              checksum: 'some_checksum',
            },
          ],
        })
        .expect(201);

      const { data } = (await importerQueue.getWaiting())[0];
      expect(data.appId).toBe(app.id);
      expect(data.invokerMemberId).toBe('invoker_member_id');
      expect(data.category).toBe('member');
      expect(data.fileInfos).toStrictEqual([
        {
          checksumETag: 'some_checksum',
          fileName: 'some_key',
        },
      ]);
    });
  });

  describe('/members/export (POST)', () => {
    const route = '/members/export';

    it('Should raise unauthorized exception', async () => {
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', 'Bearer something')
        .set('host', appHost.host)
        .send({
          appId: app.id,
          memberIds: [],
        })
        .expect(401);
    });

    it('Should raise bad request exception', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          memberId: 'invoker_member_id',
        },
        jwtSecret,
      );

      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({})
        .expect(400);
    });

    it('Should insert job into queue', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');
      const exporterQueue = application.get<Queue>(getQueueToken(ExporterTasker.name));
      await exporterQueue.empty();

      const token = jwt.sign(
        {
          memberId: 'invoker_member_id',
        },
        jwtSecret,
      );
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          appId: app.id,
          memberIds: [],
        })
        .expect(201);

      const { data } = (await exporterQueue.getWaiting())[0];
      expect(data.appId).toBe(app.id);
      expect(data.invokerMemberId).toBe('invoker_member_id');
      expect(data.category).toBe('member');
      expect(data.memberIds).toStrictEqual([]);
    });
  });
});
