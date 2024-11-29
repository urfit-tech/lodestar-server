import jwt from 'jsonwebtoken';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import request from 'supertest';
import { EntityManager, Repository } from 'typeorm';
import { App } from '~/app/entity/app.entity';
import { AppHost } from '~/app/entity/app_host.entity';
import { ApplicationModule } from '~/application.module';
import { CoinLog } from '~/entity/CoinLog';
import { appHost, app, appPlan } from '../data';
import { ImporterTasker } from '~/tasker/importer.tasker';
import { Queue } from 'bull';
import { getQueueToken } from '@nestjs/bull';
import { AppPlan } from '~/entity/AppPlan';
import { ApiExceptionFilter } from '~/api.filter';

describe('CoinController(e2e)', () => {
  let application: INestApplication;

  let manager: EntityManager;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appHostRepo: Repository<AppHost>;
  let coinLogRepo: Repository<CoinLog>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture.createNestApplication();

    application.useGlobalPipes(new ValidationPipe()).useGlobalFilters(new ApiExceptionFilter());

    manager = application.get<EntityManager>(getEntityManagerToken());
    coinLogRepo = manager.getRepository(CoinLog);
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    appHostRepo = manager.getRepository(AppHost);

    await coinLogRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});

    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await appHostRepo.save(appHost);

    await application.init();
  });

  afterEach(async () => {
    await coinLogRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});

    await application.close();
  });

  describe('/coins/import (POST)', () => {
    const route = '/coins/import';

    it('Should raise unauthorized exception', async () => {
      await request(application.getHttpServer())
        .post(route)
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
          permissions: ['MEMBER_ADMIN'],
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
          permissions: ['MEMBER_ADMIN'],
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
      expect(data.category).toBe('coin');
      expect(data.fileInfos).toStrictEqual([
        {
          checksumETag: 'some_checksum',
          fileName: 'some_key',
        },
      ]);
    });
  });
});
