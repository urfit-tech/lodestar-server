import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';

import { PostgresModule } from '~/database/postgres.module';
import { ApiExceptionFilter } from '~/api.filter';
import { MemberModule } from '~/member/member.module';

describe('MemberController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PostgresModule.forRootAsync(),
        MemberModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalFilters(new ApiExceptionFilter());

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/members/import (POST)', () => {
    const route = '/members/import';

    it('Should raise unauthorized exception', async () => {
      await request(app.getHttpServer())
        .post(route)
        .send({})
        .expect(401);
    });
  });

  describe('/members/export (POST)', () => {
    const route = '/members/export';

    it('Should raise unauthorized exception', async () => {
      await request(app.getHttpServer())
        .post(route)
        .send({})
        .expect(401);
    });
  });
});
