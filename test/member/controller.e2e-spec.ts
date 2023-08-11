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
import { App } from '~/entity/App';
import { AppPlan } from '~/entity/AppPlan';
import { Member } from '~/member/entity/member.entity';
import { MemberGetResultDTO } from '~/member/member.dto';

import { app, appPlan } from '../data';

describe('MemberController (e2e)', () => {
  let application: INestApplication;

  let manager: EntityManager;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let memberRepo: Repository<Member>;
  
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture.createNestApplication();

    application
      .useGlobalPipes(new ValidationPipe())
      .useGlobalFilters(new ApiExceptionFilter());
    
    manager = application.get<EntityManager>(getEntityManagerToken());
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    memberRepo = manager.getRepository(Member);
    
    await memberRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});

    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    
    await application.init();
  });

  afterEach(async () => {
    await memberRepo.delete({});
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

      const token = jwt.sign({
        'memberId': 'invoker_member_id',
        'permissions': [],
      }, jwtSecret);
      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(401);
      expect(res.body.message).toBe('missing required permission');
    });

    it('Should get members with empty conditions', async () => {
      for (let i = 0; i < 5; i++) {
        let insertedMember = new Member();
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

      const token = jwt.sign({
        'appId': app.id,
        'memberId': 'invoker_member_id',
        'permissions': ['MEMBER_ADMIN'],
      }, jwtSecret);

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);
      const fetched: Array<MemberGetResultDTO> = res.body;
      const names = fetched.map(({ name }) => name);

      for (let i = 0; i < fetched.length; i++) {
        expect(names.includes(`name${0}`)).toBeTruthy();
      }
    });

    it('Should get members with name conditions', async () => {
      for (let i = 0; i < 5; i++) {
        let insertedMember = new Member();
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

      const token = jwt.sign({
        'appId': app.id,
        'memberId': 'invoker_member_id',
        'permissions': ['MEMBER_ADMIN'],
      }, jwtSecret);

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'name' })
        .expect(200);
      const fetched: Array<MemberGetResultDTO> = res.body;
      const names = fetched.map(({ name }) => name);

      for (let i = 0; i < fetched.length; i++) {
        expect(names.includes(`name${0}`)).toBeTruthy();
      }
    });

    it('Should get members with name conditions', async () => {
      let managerMember = new Member();
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
        let insertedMember = new Member();
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

      const token = jwt.sign({
        'appId': app.id,
        'memberId': 'invoker_member_id',
        'permissions': ['MEMBER_ADMIN'],
      }, jwtSecret);

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .send({ managerName: managerMember.name })
        .expect(200);
      const fetched: Array<MemberGetResultDTO> = res.body;

      for (let i = 0; i < fetched.length; i++) {
        const member = fetched[i];
        expect(member.manager_id).toBe(managerMember.id);
      }
    });

    it('Should get empty members with nested not matched conditions', async () => {
      for (let i = 0; i < 5; i++) {
        let insertedMember = new Member();
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

      const token = jwt.sign({
        'appId': app.id,
        'memberId': 'invoker_member_id',
        'permissions': ['MEMBER_ADMIN'],
      }, jwtSecret);

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'name',
          username: 'unable-to-match-condition',
        })
        .expect(200);
      const fetched: Array<MemberGetResultDTO> = res.body;
      expect(fetched.length).toBe(0);
    });

    it('Should get members with matched nested conditions', async () => {
      for (let i = 0; i < 5; i++) {
        let insertedMember = new Member();
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

      const token = jwt.sign({
        'appId': app.id,
        'memberId': 'invoker_member_id',
        'permissions': ['MEMBER_ADMIN'],
      }, jwtSecret);

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'name',
          username: 'user',
        })
        .expect(200);
      const fetched: Array<MemberGetResultDTO> = res.body;
      const names = fetched.map(({ name }) => name);

      for (let i = 0; i < fetched.length; i++) {
        expect(names.includes(`name${0}`)).toBeTruthy();
      }
    });
  });

  describe('/members/import (POST)', () => {
    const route = '/members/import';

    it('Should raise unauthorized exception', async () => {
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer something`)
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

      const token = jwt.sign({
        'memberId': 'invoker_member_id',
      }, jwtSecret);
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });

    it('Should insert job into queue', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');
      const importerQueue = application.get<Queue>(getQueueToken(ImporterTasker.name));
      await importerQueue.empty();
      
      const token = jwt.sign({
        'memberId': 'invoker_member_id',
      }, jwtSecret);
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .send({
          appId: app.id,
          fileInfos: [{
            key: 'some_key',
            checksum: 'some_checksum',
          }],
        })
        .expect(201);
      
      const { data } = (await importerQueue.getWaiting())[0];
      expect(data.appId).toBe(app.id);
      expect(data.invokerMemberId).toBe('invoker_member_id');
      expect(data.category).toBe('member');
      expect(data.fileInfos).toStrictEqual([{
        checksumETag: 'some_checksum',
        fileName: 'some_key',
      }]);
    });
  });

  describe('/members/export (POST)', () => {
    const route = '/members/export';

    it('Should raise unauthorized exception', async () => {
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', 'Bearer something')
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

      const token = jwt.sign({
        'memberId': 'invoker_member_id',
      }, jwtSecret);

      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });

    it('Should insert job into queue', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');
      const exporterQueue = application.get<Queue>(getQueueToken(ExporterTasker.name));
      await exporterQueue.empty();
      
      const token = jwt.sign({
        'memberId': 'invoker_member_id',
      }, jwtSecret);
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
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
