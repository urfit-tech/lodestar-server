import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { ApplicationModule } from '~/application.module';

describe('ApplicationController (e2e)', () => {
  let application: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture.createNestApplication();

    await application.init();
  });

  afterEach(async () => {
    await application.close();
  });

  describe('/healthz (GET)', () => {
    const route = '/healthz';

    it('Should return health check', async () => {
      const { text } = await request(application.getHttpServer())
        .get(route)
        .expect(200);
      expect(new Date(text)).not.toBeNull;
    });
  });  
});
