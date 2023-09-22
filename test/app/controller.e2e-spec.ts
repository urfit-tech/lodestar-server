import request from 'supertest';
import { EntityManager, Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';

import { AppPlan } from '~/entity/AppPlan';
import { ApplicationModule } from '~/application.module';
import { ApiExceptionFilter } from '~/api.filter';
import { App } from '~/app/entity/app.entity';
import { AppHost } from '~/app/entity/app_host.entity';

import { app, appHost, appPlan } from '../data';

describe('AppController (e2e)', () => {
  let application: INestApplication;
  let manager: EntityManager;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appHostRepo: Repository<AppHost>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture
      .createNestApplication()
      .useGlobalPipes(new ValidationPipe())
      .useGlobalFilters(new ApiExceptionFilter());

    manager = application.get<EntityManager>(getEntityManagerToken());
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    appHostRepo = manager.getRepository(AppHost);

    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    
    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await appHostRepo.save(appHost);
    
    await application.init();
  });

  afterEach(async () => {
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});

    await application.close();
  });

  describe('/app (GET)', () => {
    const route = '/app';

    it('Should raise error', async () => {
      const { body } = await request(application.getHttpServer())
        .get(route)
        .expect(500);
      expect(body).toStrictEqual({
        message: 'cannot get the app: no app in this host',
      });
    });

    it('Should return app id', async () => {
      const { text } = await request(application.getHttpServer())
        .get(route)
        .set('host', appHost.host)
        .expect(200);
      expect(text).toBe(app.id);
    });
  });  
});
