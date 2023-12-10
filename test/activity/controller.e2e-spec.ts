import { EntityManager, Repository } from 'typeorm';
import request from 'supertest';
import { v4 } from 'uuid';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';

import { ApplicationModule } from '~/application.module';
import { Role } from '~/entity/Role';
import { AppPlan } from '~/entity/AppPlan';
import { App } from '~/app/entity/app.entity';
import { AppHost } from '~/app/entity/app_host.entity';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { Member } from '~/member/entity/member.entity';

import { role, app, appPlan, appSecret, appSetting, appHost } from '../data';

interface RepositoryMap {
  [key: string]: Repository<any>;
}

const ACTIVITY_ROUTE = '/activity/activity_collection';
const AUTH_TOKEN_ROUTE = '/auth/token';

describe('ActivityController (e2e)', () => {
  let application: INestApplication;
  let repositories;

  async function initializeRepositories(manager: EntityManager) {
    return {
      memberRepo: manager.getRepository(Member),
      appSettingRepo: manager.getRepository(AppSetting),
      appSecretRepo: manager.getRepository(AppSecret),
      appHostRepo: manager.getRepository(AppHost),
      appRepo: manager.getRepository(App),
      appPlanRepo: manager.getRepository(AppPlan),
      roleRepo: manager.getRepository(Role),
    };
  }

  async function clearRepositories(repositories: RepositoryMap) {
    for (const repoKey in repositories) {
      if (repositories.hasOwnProperty(repoKey)) {
        const repo = repositories[repoKey];
        await repo.delete({});
      }
    }
  }

  async function fetchToken() {
    try {
      const tokenResponse = await request(application.getHttpServer())
        .post(AUTH_TOKEN_ROUTE)
        .set('host', appHost.host)
        .send({ clientId: 'test', key: 'testKey', permissions: [] });

      const { authToken } = tokenResponse.body.result;

      const requestHeader = {
        Authorization: `Bearer ${authToken}`,
        host: 'test.something.com',
      };

      return { authToken, requestHeader };
    } catch (error) {
      console.error('Error fetching token:', error);
      throw new Error('Failed to fetch token');
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = module.createNestApplication();

    const manager = application.get<EntityManager>(getEntityManagerToken());

    repositories = await initializeRepositories(manager);
    await clearRepositories(repositories);

    await repositories.roleRepo.save(role);
    await repositories.appPlanRepo.save(appPlan);
    await repositories.appRepo.save(app);
    await repositories.appHostRepo.save(appHost);
    await repositories.appSecretRepo.save(appSecret);
    await repositories.appSettingRepo.save(appSetting);

    await application.init();
  });

  afterEach(async () => {
    await clearRepositories(repositories);

    await application.close();
  });

  describe('Activity Collection API', () => {
    it('Should get activity collection successfully', async () => {
      const { authToken, requestHeader } = await fetchToken();

      await request(application.getHttpServer()).get(ACTIVITY_ROUTE).set(requestHeader).expect(200);
    });
  });
});
