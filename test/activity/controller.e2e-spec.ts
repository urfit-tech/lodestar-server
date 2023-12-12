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
import { Activity } from '~/activity/entity/Activity';
import { ActivitySession } from '~/activity/entity/ActivitySession';
import { ActivityTicket } from '~/activity/entity/ActivityTicket';
import { ActivitySessionTicket } from '~/activity/entity/ActivitySessionTicket';
import { OrderLog } from '~/order/entity/order_log.entity';
import { OrderProduct } from '~/order/entity/order_product.entity';
import { Product } from '~/entity/Product';
import { Currency } from '~/entity/Currency';

interface RepositoryMap {
  [key: string]: Repository<any>;
}

const ACTIVITY_ROUTE = '/activity/activity_collection';
const AUTH_TOKEN_ROUTE = '/auth/token';

describe('ActivityController (e2e)', () => {
  let application: INestApplication;
  let manager: EntityManager;
  let repositories;

  async function initializeRepositories(manager: EntityManager) {
    return {
      orderProductRepo: manager.getRepository(OrderProduct),
      productRepo: manager.getRepository(Product),
      orderLogRepo: manager.getRepository(OrderLog),
      currencyRepo: manager.getRepository(Currency),
      activitySessionTicketRepo: manager.getRepository(ActivitySessionTicket),
      activityTicketRepo: manager.getRepository(ActivityTicket),
      activitySessionRepo: manager.getRepository(ActivitySession),
      activityRepo: manager.getRepository(Activity),
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

    manager = application.get<EntityManager>(getEntityManagerToken());

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

  describe('Response', () => {
    it('should get correct response', async () => {
      const { requestHeader } = await fetchToken();

      const basicCondition = {
        organizerId: null,
        isPrivate: false,
        publishedAtNotNull: true,
        activityEndedAfterNow: false,
        appId: app.id,
      };

      const memberId = v4();
      const insertedMember = new Member();
      insertedMember.appId = app.id;
      insertedMember.id = memberId;
      insertedMember.name = 'someName';
      insertedMember.username = 'username';
      insertedMember.email = 'example.com';
      insertedMember.role = 'app-owner';
      insertedMember.star = 0;
      insertedMember.createdAt = new Date();
      insertedMember.loginedAt = new Date();
      await manager.save(insertedMember);

      const insertedActivity = new Activity();
      insertedActivity.app = app;
      insertedActivity.organizer = insertedMember;
      insertedActivity.title = 'AAAAA';
      insertedActivity.description = 'BBBBBB';
      insertedActivity.isPrivate = false;
      await manager.save(insertedActivity);

      const insertedActivitySession = new ActivitySession();
      insertedActivitySession.activity = insertedActivity;
      insertedActivitySession.startedAt = new Date('2020-01-01T00:00:00Z');
      insertedActivitySession.endedAt = new Date('2020-01-02T00:00:00Z');
      insertedActivitySession.title = '第一場｜Lesson 1';
      insertedActivitySession.location = '台北市中正區南陽街 13 號';
      await manager.save(insertedActivitySession);

      const insertedActivitySession2 = new ActivitySession();
      insertedActivitySession2.activity = insertedActivity;
      insertedActivitySession2.startedAt = new Date('2020-01-03T00:00:00Z');
      insertedActivitySession2.endedAt = new Date('2020-01-04T00:00:00Z');
      insertedActivitySession2.title = '第一場｜Lesson 2';
      insertedActivitySession2.location = '台北市中正區南陽街 13 號';
      await manager.save(insertedActivitySession2);

      const insertedActivityTicket = new ActivityTicket();
      insertedActivityTicket.activity = insertedActivity;
      insertedActivityTicket.count = 100;
      insertedActivityTicket.title = '早鳥票';
      insertedActivityTicket.price = 2000;
      insertedActivityTicket.isPublished = true;
      insertedActivityTicket.startedAt = new Date('2020-01-01T00:00:00Z');
      insertedActivityTicket.endedAt = new Date('2020-01-02T00:00:00Z');
      await manager.save(insertedActivityTicket);

      const insertedActivityTicket2 = new ActivityTicket();
      insertedActivityTicket2.activity = insertedActivity;
      insertedActivityTicket2.count = 100;
      insertedActivityTicket2.title = '一般票';
      insertedActivityTicket2.price = 2000;
      insertedActivityTicket2.isPublished = true;
      insertedActivityTicket2.startedAt = new Date('2020-01-01T00:00:00Z');
      insertedActivityTicket2.endedAt = new Date('2020-01-02T00:00:00Z');
      await manager.save(insertedActivityTicket2);

      const insertedActivitySessionTicket = new ActivitySessionTicket();
      insertedActivitySessionTicket.activitySession = insertedActivitySession;
      insertedActivitySessionTicket.activitySessionType = 'offline';
      insertedActivitySessionTicket.activityTicket = insertedActivityTicket;
      await manager.save(insertedActivitySessionTicket);

      const insertedActivitySessionTicket2 = new ActivitySessionTicket();
      insertedActivitySessionTicket2.activitySession = insertedActivitySession;
      insertedActivitySessionTicket2.activitySessionType = 'online';
      insertedActivitySessionTicket2.activityTicket = insertedActivityTicket2;
      await manager.save(insertedActivitySessionTicket2);

      const insertedOrderLog = new OrderLog();
      insertedOrderLog.appId = app.id;
      insertedOrderLog.member = insertedMember;
      insertedOrderLog.invoiceOptions = {
        name: 'XXX',
        email: 'XXXX@gmail.com',
        phone: '0934567890',
        donationCode: '5380',
      };
      await manager.save(insertedOrderLog);

      const insertedProduct = new Product();
      insertedProduct.id = `ActivityTicket_${insertedActivityTicket.id}`;
      insertedProduct.type = 'ActivityTicket';
      insertedProduct.target = insertedActivityTicket.id;
      await manager.save(insertedProduct);

      const insertedCurrency = new Currency();
      insertedCurrency.id = 'TWD';
      insertedCurrency.minorUnits = 2;
      insertedCurrency.label = 'default';
      insertedCurrency.unit = 'default';
      insertedCurrency.name = 'default';
      await manager.save(insertedCurrency);

      const insertedOrderProduct = new OrderProduct();
      insertedOrderProduct.name = 'XXXX';
      insertedOrderProduct.price = 2000;
      insertedOrderProduct.order = insertedOrderLog;
      insertedOrderProduct.deliveredAt = new Date('2020-01-01T00:00:00Z');
      insertedOrderProduct.options = {
        from: `/activities/${insertedActivity.id}`,
        currencyId: 'TWD',
        currencyPrice: 2000,
      };
      insertedOrderProduct.product = insertedProduct;
      insertedOrderProduct.currency = insertedCurrency;
      await manager.save(insertedOrderProduct);

      const response = await request(application.getHttpServer())
        .get(ACTIVITY_ROUTE)
        .set(requestHeader)
        .send({
          basicCondition,
          categoryId: null,
          limit: 20,
          offset: 0,
        })
        .expect(200);

      expect(response.body).toEqual({
        activities: [
          {
            id: insertedActivity.id,
            coverUrl: insertedActivity.coverUrl,
            title: insertedActivity.title,
            publishedAt: insertedActivity.publishedAt,
            includeSessionTypes: [
              insertedActivitySessionTicket.activitySessionType,
              insertedActivitySessionTicket2.activitySessionType,
            ],
            participantsCount: {
              online: '0',
              offline: '1',
            },
            startedAt: insertedActivitySession.startedAt.toISOString(),
            endedAt: insertedActivitySession2.endedAt.toISOString(),
            isPrivate: insertedActivity.isPrivate,
          },
        ],
        totalCount: 1,
      });

      expect(response.body.totalCount).toBe(1);
    });
  });
});
