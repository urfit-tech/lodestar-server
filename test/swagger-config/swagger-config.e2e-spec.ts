import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { ApplicationModule } from '~/application.module';
import { SwaggerConfigService } from '~/swagger-config/swagger-config.service';
import { MemberModule } from '~/member/member.module';
import { AuthModule } from '~/auth/auth.module';
import supertest from 'supertest';

describe('SwaggerConfigService (e2e)', () => {
  let application: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture.createNestApplication();

    SwaggerConfigService.setupSwagger(application, {
      title: 'Member API',
      version: '2',
      tags: ['Auth', 'Member'],
      bearerAuth: true,
      endpoint: 'lodestar/docs/member',
      documentOptions: { include: [MemberModule, AuthModule] },
      routeFilter: (path) => path.includes('/v2/'),
    });

    await application.init();
  });

  afterEach(async () => {
    await application.close();
  });

  it('/lodestar/docs/member', async () => {
    const response = await request(application.getHttpServer()).get('/lodestar/docs/member');

    expect(response.status).toEqual(200);
  });
});
