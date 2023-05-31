import jwt from 'jsonwebtoken';
import { Queue } from 'bull';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';
import request from 'supertest';

import { ApplicationModule } from '~/application.module';
import { ApiExceptionFilter } from '~/api.filter';
import { ExporterTasker } from '~/tasker/exporter.tasker';

import { app } from './data';

describe('MemberController (e2e)', () => {
  let application: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture.createNestApplication();

    application.useGlobalFilters(new ApiExceptionFilter());

    await application.init();
  });

  afterEach(async () => {
    await application.close();
  });

  describe('/members/import (POST)', () => {
    const route = '/members/import';

    it('Should raise unauthorized exception', async () => {
      await request(application.getHttpServer())
        .post(route)
        .send({})
        .expect(401);
    });
  });

  describe('/members/export (POST)', () => {
    const route = '/members/export';

    it('Should raise unauthorized exception', async () => {
      await request(application.getHttpServer())
        .post(route)
        .send({})
        .expect(401);
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
