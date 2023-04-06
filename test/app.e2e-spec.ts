import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { ApiExceptionFilter } from '~/api.filter';

import { ApplicationModule } from '~/application.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = moduleFixture
      .createNestApplication()
      .useGlobalFilters(new ApiExceptionFilter());

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/healthz (GET)', () => {
    const route = '/healthz';

    it('Should return health check', async () => {
      const { text } = await request(app.getHttpServer())
        .get(route)
        .expect(200);
      expect(new Date(text)).not.toBeNull;
    });
  });  
});
