import request from 'supertest';
import { EntityManager, Repository } from 'typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';

import { ApplicationModule } from '~/application.module';
import { App } from '~/entity/App';
import { AppPlan } from '~/entity/AppPlan';
import { AppHost } from '~/app/entity/app_host.entity';
import { ApiExceptionFilter } from '~/api.filter';

import { app, appHost, appPlan } from '../data';

describe('AuthController (e2e)', () => {
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
    
    await application.close()
  })

  describe('/auth/token (POST)', () => {
    const route = '/auth/token';

    it('Should return E_NOT_FOUND error', async () => {
      const { body } = await request(application.getHttpServer())
        .post(route)
        .set('host', appHost.host)
        .send({
          clientId: 'not_exists',
          key: 'not_exists',
          permissions: [],
        })
        .expect(400);
      
      expect(body).toStrictEqual({
        code: 'E_NOT_FOUND',
        message: 'client ID doesn\'t exist',
        result: null,
      });
    });

    // TODO:
    //   After Hasura containerize, build test set and uncomment code below.
    // it('Should return E_AUTH_TOKEN error', async () => {
    //   const { body } = await request(app.getHttpServer())
    //     .post('/auth/token')
    //     .send({
    //       clientId: 'not_exists',
    //       key: 'not_exists',
    //       permissions: [],
    //     })
    //     .expect(400);
      
    //   expect(body).toStrictEqual({
    //     code: 'E_AUTH_TOKEN',
    //     message: 'key is not authenticated',
    //     result: null,
    //   });
    // });

    // it('Should return authToken', async () => {
    //   const { body } = await request(app.getHttpServer())
    //     .post('/auth/token')
    //     .send({
    //       clientId: 'not_exists',
    //       key: 'not_exists',
    //       permissions: [],
    //     })
    //     .expect(200);
      
    //   const { authToken } = body;
    //   expect(body).toStrictEqual({
    //     code: 'SUCCESS',
    //     message: 'get auth token successfully',
    //     result: { authToken },
    //   });
    // });
  });
});