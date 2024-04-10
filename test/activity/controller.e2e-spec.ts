import { EntityManager, Repository } from 'typeorm';
import request from 'supertest';
import { v4 } from 'uuid';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
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
import { createTestActivitySessionTicket } from '../factory/activitySessionTicket.factory';
import { createTestActivityTicket } from '../factory/activityTicket.factory';
import { createTestOrderLog } from '../factory/oderLog.factory';
import { createTestProduct } from '../factory/product.factory';
import { createTestCurrency } from '../factory/currency.factory';
import { createTestOrderProduct } from '../factory/orderProduct.factory';
import { createTestActivitySession } from '../factory/activitySession.factory';
import { createTestActivity } from '../factory/activity.factory';
import { createTestMember } from '../factory/member.factory';
import { createTestCategory } from '../factory/category.factory';
import { createTestActivityCategory } from '../factory/activityCategory.factory';
import { ActivityCategory } from '~/activity/entity/ActivityCategory';
import { Category } from '~/definition/entity/category.entity';
import { ApiExceptionFilter } from '~/api.filter';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { FetchMemberRightActivityTicketDTO } from '~/activity/dto/member-right-activity-ticket.dto';
import Joi from 'joi';
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
      activityCategoryRepo: manager.getRepository(ActivityCategory),
      categoryRepo: manager.getRepository(Category),
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
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture.createNestApplication();

    application.useGlobalPipes(new ValidationPipe()).useGlobalFilters(new ApiExceptionFilter());

    application = moduleFixture.createNestApplication();

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

  describe('GET /activity_collection', () => {
    describe('Response', () => {
      it('should get correct response', async () => {
        const { requestHeader } = await fetchToken();
        const currentDate = new Date();
  
        const basicCondition = {
          organizerId: null,
          appId: app.id,
          scenario: 'holding',
        };
  
        const insertedMember = await createTestMember(manager, {
          appId: app.id,
          role: 'app-owner',
        });
  
        const insertedMember2 = await createTestMember(manager, {
          appId: app.id,
        });
  
        const insertedActivity = await createTestActivity(manager, {
          app: app,
          organizer: insertedMember,
          isPrivate: false, // scenario: 'holding' condition
          publishedAt: new Date(), // scenario: 'holding' condition
        });
  
        const insertedActivitySession1 = await createTestActivitySession(manager, {
          activity: insertedActivity,
          startedAt: new Date('2020-01-01T00:00:00Z'),
          endedAt: new Date('2020-01-02T00:00:00Z'),
        });
  
        const insertedActivitySession2 = await createTestActivitySession(manager, {
          activity: insertedActivity,
          startedAt: new Date('2020-01-03T00:00:00Z'),
          endedAt: new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000), // scenario: 'holding' condition
        });
  
        const insertedActivityTicket1 = await createTestActivityTicket(manager, {
          activity: insertedActivity,
          startedAt: new Date('2020-01-01T00:00:00Z'),
          endedAt: new Date('2020-01-02T00:00:00Z'),
        });
  
        const insertedActivityTicket2 = await createTestActivityTicket(manager, {
          activity: insertedActivity,
          startedAt: new Date('2020-01-03T00:00:00Z'),
          endedAt: new Date('2020-01-04T00:00:00Z'),
        });
  
        const insertedActivitySessionTicket1 = await createTestActivitySessionTicket(manager, {
          activitySession: insertedActivitySession1,
          activityTicket: insertedActivityTicket1,
          activitySessionType: 'offline',
        });
  
        const insertedActivitySessionTicket2 = await createTestActivitySessionTicket(manager, {
          activitySession: insertedActivitySession2,
          activityTicket: insertedActivityTicket2,
          activitySessionType: 'online',
        });
  
        const insertedOrderLog = await createTestOrderLog(manager, {
          member: insertedMember,
          appId: app.id,
        });
  
        const insertedOrderLog2 = await createTestOrderLog(manager, {
          member: insertedMember2,
          appId: app.id,
        });
  
        const insertedProduct = await createTestProduct(manager, {
          id: `ActivityTicket_${insertedActivityTicket1.id}`,
          type: 'ActivityTicket',
          target: insertedActivityTicket1.id,
        });
  
        const insertedProduct2 = await createTestProduct(manager, {
          id: `ActivityTicket_${insertedActivityTicket2.id}`,
          type: 'ActivityTicket',
          target: insertedActivityTicket1.id,
        });
  
        const insertedCurrency = await createTestCurrency(manager, {
          id: 'TWD',
        });
  
        const insertedOrderProduct = await createTestOrderProduct(manager, {
          order: insertedOrderLog,
          product: insertedProduct,
          currency: insertedCurrency,
          productId: insertedActivity.id,
          options: {
            from: `/activities/${insertedActivity.id}`,
            currencyId: insertedCurrency.id,
            currencyPrice: 2000,
          },
        });
  
        const insertedOrderProduct2 = await createTestOrderProduct(manager, {
          order: insertedOrderLog2,
          product: insertedProduct2,
          currency: insertedCurrency,
          productId: insertedActivity.id,
          options: {
            from: `/activities/${insertedActivity.id}`,
            currencyId: insertedCurrency.id,
            currencyPrice: 2000,
          },
        });
  
        const response = await request(application.getHttpServer())
          .get(
            ACTIVITY_ROUTE +
              `?basicCondition=${encodeURIComponent(JSON.stringify(basicCondition))}&limit=20&offset=0&categoryId=`,
          )
          .set(requestHeader)
          .expect(200);
  
        expect(response.body).toEqual({
          activities: [
            {
              id: insertedActivity.id,
              coverUrl: insertedActivity.coverUrl,
              title: insertedActivity.title,
              publishedAt: insertedActivity.publishedAt.toISOString(),
              createdAt: insertedActivity.createdAt.toISOString(),
              includeSessionTypes: [
                insertedActivitySessionTicket1.activitySessionType,
                insertedActivitySessionTicket2.activitySessionType,
              ],
              participantsCount: {
                online: 1,
                offline: 1,
              },
              startedAt: insertedActivitySession1.startedAt.toISOString(),
              endedAt: insertedActivitySession2.endedAt.toISOString(),
              isPrivate: insertedActivity.isPrivate,
            },
          ],
          totalCount: 1,
        });
  
        expect(response.body.totalCount).toBe(1);
      });
  
      it('should get correct category response', async () => {
        const { requestHeader } = await fetchToken();
        const currentDate = new Date();
  
        const basicCondition = {
          organizerId: null,
          appId: app.id,
          scenario: 'holding',
        };
  
        const insertedMember = await createTestMember(manager, {
          appId: app.id,
          role: 'app-owner',
        });
  
        const insertedCategory = await createTestCategory(manager, {
          appId: app.id,
          class: 'activity',
        });
  
        const activities = [];
        const activityCategories = [];
  
        for (let i = 0; i < 2; i++) {
          const insertedActivity = await createTestActivity(manager, {
            app: app,
            organizer: insertedMember,
            isPrivate: false,
            publishedAt: new Date(),
          });
  
          activities.push(insertedActivity);
  
          const insertedActivityCategory = await createTestActivityCategory(manager, {
            activity: insertedActivity,
            category: insertedCategory,
          });
  
          activityCategories.push(insertedActivityCategory);
        }
  
        const insertedActivity = await createTestActivity(manager, {
          app: app,
          organizer: insertedMember,
          isPrivate: false,
          publishedAt: new Date(),
        });
  
        const activitySessions = [];
  
        for (const activity of activities) {
          const insertedActivitySession = await createTestActivitySession(manager, {
            activity: activity,
            startedAt: new Date(),
            endedAt: new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from the current date
          });
  
          activitySessions.push(insertedActivitySession);
        }
  
        const response = await request(application.getHttpServer())
          .get(
            ACTIVITY_ROUTE +
              `?basicCondition=${encodeURIComponent(JSON.stringify(basicCondition))}&limit=${20}&offset=${0}&categoryId=${
                insertedCategory.id
              }`,
          )
          .set(requestHeader)
          .expect(200);
  
        expect(response.body.activities.map((v) => v.id).includes(activities[0].id)).toBe(true);
        expect(response.body.activities.map((v) => v.id).includes(insertedActivity.id)).toBe(false);
  
        expect(response.body.totalCount).toBe(2);
      });
  
      it('should get correct offset and limit top 10', async () => {
        const { requestHeader } = await fetchToken();
        const currentDate = new Date();
  
        const basicCondition = {
          organizerId: null,
          appId: app.id,
          scenario: 'holding',
        };
  
        const insertedMember = await createTestMember(manager, {
          appId: app.id,
          role: 'app-owner',
        });
  
        const insertedCategory = await createTestCategory(manager, {
          appId: app.id,
          class: 'activity',
        });
  
        const activities = [];
  
        for (let i = 0; i < 50; i++) {
          const insertedActivity = await createTestActivity(manager, {
            app: app,
            organizer: insertedMember,
            isPrivate: false,
            publishedAt: new Date(),
          });
  
          activities.push(insertedActivity);
        }
  
        const activitySessions = [];
  
        for (const activity of activities) {
          const insertedActivitySession = await createTestActivitySession(manager, {
            activity: activity,
            startedAt: new Date(),
            endedAt: new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from the current date
          });
  
          activitySessions.push(insertedActivitySession);
        }
        const response = await request(application.getHttpServer())
          .get(
            ACTIVITY_ROUTE +
              `?basicCondition=${encodeURIComponent(JSON.stringify(basicCondition))}&limit=${20}&offset=${0}&categoryId=`,
          )
          .set(requestHeader)
          .expect(200);
  
        expect(response.body.activities.length).toBe(20);
  
        const expectedActivityIds = activities.slice(40, 50).map((activity) => activity.id);
        expect(response.body.activities.map((v) => v.id)).toEqual(expect.arrayContaining(expectedActivityIds));
      });
  
      it('should get correct activity , offset 2 limit 8', async () => {
        const { requestHeader } = await fetchToken();
        const currentDate = new Date();
  
        const basicCondition = {
          organizerId: null,
          appId: app.id,
          scenario: 'holding',
        };
  
        const insertedMember = await createTestMember(manager, {
          appId: app.id,
          role: 'app-owner',
        });
  
        const insertedCategory = await createTestCategory(manager, {
          appId: app.id,
          class: 'activity',
        });
  
        const activities = [];
  
        for (let i = 0; i < 50; i++) {
          const insertedActivity = await createTestActivity(manager, {
            app: app,
            organizer: insertedMember,
            isPrivate: false,
            publishedAt: new Date(),
          });
  
          activities.push(insertedActivity);
        }
  
        const activitySessions = [];
  
        for (const activity of activities) {
          const insertedActivitySession = await createTestActivitySession(manager, {
            activity: activity,
            startedAt: new Date(),
            endedAt: new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from the current date
          });
  
          activitySessions.push(insertedActivitySession);
        }
  
        const response = await request(application.getHttpServer())
          .get(
            ACTIVITY_ROUTE +
              `?basicCondition=${encodeURIComponent(JSON.stringify(basicCondition))}&limit=${8}&offset=${2}&categoryId=`,
          )
          .set(requestHeader)
          .expect(200);
  
        expect(response.body.activities.length).toBe(8);
  
        const expectedActivityIds = activities.slice(40, 48).map((activity) => activity.id);
        expect(response.body.activities.map((v) => v.id)).toEqual(expect.arrayContaining(expectedActivityIds));
      });
    });
  
    describe('scenario', () => {
      it('finished', async () => {
        const { requestHeader } = await fetchToken();
        const currentDate = new Date();
  
        const basicCondition = {
          organizerId: null,
          appId: app.id,
          scenario: 'finished',
        };
  
        const insertedMember = await createTestMember(manager, {
          appId: app.id,
          role: 'app-owner',
        });
  
        const insertedCategory = await createTestCategory(manager, {
          appId: app.id,
          class: 'activity',
        });
  
        const activities = [];
        const activityCategories = [];
  
        for (let i = 0; i < 5; i++) {
          const insertedActivity = await createTestActivity(manager, {
            app: app,
            organizer: insertedMember,
            isPrivate: false,
            publishedAt: new Date(),
          });
  
          activities.push(insertedActivity);
  
          const insertedActivityCategory = await createTestActivityCategory(manager, {
            activity: insertedActivity,
            category: insertedCategory,
          });
  
          activityCategories.push(insertedActivityCategory);
        }
  
        const insertedActivityNotFinished = await createTestActivity(manager, {
          app: app,
          organizer: insertedMember,
          isPrivate: false,
          publishedAt: new Date(),
        });
  
        const activitySessions = [];
  
        for (const activity of activities) {
          const insertedActivitySession = await createTestActivitySession(manager, {
            activity: activity,
            startedAt: new Date(),
            endedAt: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days before the current date
          });
  
          activitySessions.push(insertedActivitySession);
        }
  
        const insertedActivitySession = await createTestActivitySession(manager, {
          activity: insertedActivityNotFinished,
          startedAt: new Date(),
          endedAt: new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days after the current date
        });
  
        const response = await request(application.getHttpServer())
          .get(
            ACTIVITY_ROUTE +
              `?basicCondition=${encodeURIComponent(JSON.stringify(basicCondition))}&limit=${20}&offset=${0}&categoryId=${
                insertedCategory.id
              }`,
          )
          .set(requestHeader)
          .expect(200);
  
        expect(response.body.activities.map((v) => v.id).includes(activities[0].id)).toBe(true);
        expect(response.body.activities.map((v) => v.id).includes(insertedActivityNotFinished.id)).toBe(false);
  
        expect(response.body.totalCount).toBe(5);
      });
  
      it('draft', async () => {
        const { requestHeader } = await fetchToken();
        const currentDate = new Date();
  
        const basicCondition = {
          organizerId: null,
          appId: app.id,
          scenario: 'draft',
        };
  
        const insertedMember = await createTestMember(manager, {
          appId: app.id,
          role: 'app-owner',
        });
  
        const insertedCategory = await createTestCategory(manager, {
          appId: app.id,
          class: 'activity',
        });
  
        const activities = [];
        const activityCategories = [];
  
        for (let i = 0; i < 5; i++) {
          const insertedActivity = await createTestActivity(manager, {
            app: app,
            organizer: insertedMember,
            isPrivate: false,
            publishedAt: new Date(),
          });
  
          activities.push(insertedActivity);
  
          const insertedActivityCategory = await createTestActivityCategory(manager, {
            activity: insertedActivity,
            category: insertedCategory,
          });
  
          activityCategories.push(insertedActivityCategory);
        }
  
        const insertedActivityNotPublished = await createTestActivity(manager, {
          app: app,
          organizer: insertedMember,
          isPrivate: false,
          publishedAt: null,
        });
  
        const activitySessions = [];
  
        for (const activity of activities) {
          const insertedActivitySession = await createTestActivitySession(manager, {
            activity: activity,
            startedAt: new Date(),
            endedAt: new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days after the current date
          });
  
          activitySessions.push(insertedActivitySession);
        }
  
        const insertedActivitySession = await createTestActivitySession(manager, {
          activity: insertedActivityNotPublished,
          startedAt: new Date(),
          endedAt: new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days after the current date
        });
  
        const response = await request(application.getHttpServer())
          .get(
            ACTIVITY_ROUTE +
              `?basicCondition=${encodeURIComponent(JSON.stringify(basicCondition))}&limit=${20}&offset=${0}&categoryId=`,
          )
          .set(requestHeader)
          .expect(200);
  
        expect(response.body.activities.map((v) => v.id).includes(insertedActivityNotPublished.id)).toBe(true);
        expect(response.body.activities.map((v) => v.id).includes(activities[0].id)).toBe(false);
  
        expect(response.body.totalCount).toBe(1);
      });
  
      it('privateHolding', async () => {
        const { requestHeader } = await fetchToken();
        const currentDate = new Date();
  
        const basicCondition = {
          organizerId: null,
          appId: app.id,
          scenario: 'privateHolding',
        };
  
        const insertedMember = await createTestMember(manager, {
          appId: app.id,
          role: 'app-owner',
        });
  
        const insertedCategory = await createTestCategory(manager, {
          appId: app.id,
          class: 'activity',
        });
  
        const activities = [];
        const activityCategories = [];
  
        for (let i = 0; i < 5; i++) {
          const insertedActivity = await createTestActivity(manager, {
            app: app,
            organizer: insertedMember,
            isPrivate: false,
            publishedAt: new Date(),
          });
  
          activities.push(insertedActivity);
  
          const insertedActivityCategory = await createTestActivityCategory(manager, {
            activity: insertedActivity,
            category: insertedCategory,
          });
  
          activityCategories.push(insertedActivityCategory);
        }
  
        const insertedActivityPrivateHoding = await createTestActivity(manager, {
          app: app,
          organizer: insertedMember,
          isPrivate: true,
          publishedAt: new Date(),
        });
  
        const activitySessions = [];
  
        for (const activity of activities) {
          const insertedActivitySession = await createTestActivitySession(manager, {
            activity: activity,
            startedAt: new Date(),
            endedAt: new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days after the current date
          });
  
          activitySessions.push(insertedActivitySession);
        }
  
        const insertedActivitySession = await createTestActivitySession(manager, {
          activity: insertedActivityPrivateHoding,
          startedAt: new Date(),
          endedAt: new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days after the current date
        });
  
        const response = await request(application.getHttpServer())
          .get(
            ACTIVITY_ROUTE +
              `?basicCondition=${encodeURIComponent(JSON.stringify(basicCondition))}&limit=${20}&offset=${0}&categoryId=`,
          )
          .set(requestHeader)
          .expect(200);
  
        expect(response.body.activities.map((v) => v.id).includes(insertedActivityPrivateHoding.id)).toBe(true);
        expect(response.body.activities.map((v) => v.id).includes(activities[0].id)).toBe(false);
  
        expect(response.body.totalCount).toBe(1);
      });
    });
  })

  describe("GET /member_right", () => {
    describe("Basic Positive Tests", () => {
      let insertedMember;
      let insertedActivity;
      let insertedCategory;
      let insertedActivityCategory;
      let insertedActivitySession1;
      let insertedActivityTicket1;
      let insertedActivitySessionTicket1;
      let insertedOrderLog;
      let insertedProduct;
      let insertedCurrency;
      let insertedOrderProduct;
  
      beforeEach(async () => {
        insertedMember = await createTestMember(manager, {
          appId: app.id,
          role: "app-owner",
        });
  
        insertedActivity = await createTestActivity(manager, {
          app: app,
          organizer: insertedMember,
          isPrivate: false, // scenario: 'holding' condition
          publishedAt: new Date(), // scenario: 'holding' condition
        });
  
        insertedCategory = await createTestCategory(manager, {
          appId: app.id,
          class: "activity",
        });
  
        insertedActivityCategory = await createTestActivityCategory(manager, {
          activity: insertedActivity,
          category: insertedCategory,
        });
  
        insertedActivitySession1 = await createTestActivitySession(manager, {
          activity: insertedActivity,
          startedAt: new Date("2020-01-01T00:00:00Z"),
          endedAt: new Date("2020-01-02T00:00:00Z"),
        });
  
        insertedActivityTicket1 = await createTestActivityTicket(manager, {
          activity: insertedActivity,
          startedAt: new Date("2020-01-01T00:00:00Z"),
          endedAt: new Date("2020-01-02T00:00:00Z"),
        });
  
        insertedActivitySessionTicket1 = await createTestActivitySessionTicket(
          manager,
          {
            activitySession: insertedActivitySession1,
            activityTicket: insertedActivityTicket1,
            activitySessionType: "offline",
          },
        );
  
        insertedOrderLog = await createTestOrderLog(manager, {
          member: insertedMember,
          appId: app.id,
        });
  
        insertedProduct = await createTestProduct(manager, {
          id: `ActivityTicket_${insertedActivityTicket1.id}`,
          type: "ActivityTicket",
          target: insertedActivityTicket1.id,
        });
  
        insertedCurrency = await createTestCurrency(manager, {
          id: "TWD",
        });
  
        insertedOrderProduct = await createTestOrderProduct(manager, {
          order: insertedOrderLog,
          product: insertedProduct,
          currency: insertedCurrency,
          productId: insertedActivity.id,
          options: {
            from: `/activities/${insertedActivity.id}`,
            currencyId: insertedCurrency.id,
            currencyPrice: 2000,
          },
        });
      });
  
      it("should return 2XX HTTP status code for valid requests", async () => {
        const jwtSecret = application
          .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
          .getOrThrow("HASURA_JWT_SECRET");
  
        const token = jwt.sign(
          {
            memberId: insertedMember.id,
            permissions: [],
          },
          jwtSecret,
        );
  
        const dto: FetchMemberRightActivityTicketDTO = {
          activityTicketId: insertedActivityTicket1.id,
          sessionId: "",
        };
  
        const response = await request(application.getHttpServer())
          .get(
            `/activity/member_right?&activityTicketId=${dto.activityTicketId}${dto.sessionId ? `&sessionId=${dto.sessionId}` : ""}`,
          )
          .set("host", appHost.host)
          .set("Authorization", `Bearer ${token}`)
          .expect(200);
  
        expect(response.status).toBe(200);
      });
  
      it("should return a well-formed JSON object according to the schema", async () => {
        const jwtSecret = application
          .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
          .getOrThrow("HASURA_JWT_SECRET");
  
        const token = jwt.sign(
          {
            memberId: insertedMember.id,
            permissions: [],
          },
          jwtSecret,
        );
  
        const dto: FetchMemberRightActivityTicketDTO = {
          activityTicketId: insertedActivityTicket1.id,
          sessionId: "",
        };
  
        const { body: data } = await request(application.getHttpServer())
          .get(
            `/activity/member_right?&activityTicketId=${dto.activityTicketId}${dto.sessionId ? `&sessionId=${dto.sessionId}` : ""}`,
          )
          .set("host", appHost.host)
          .set("Authorization", `Bearer ${token}`)
          .expect(200);
  
        const activitySchema = Joi.object({
          id: Joi.string().required(),
          title: Joi.string().required(),
          coverUrl: Joi.string().allow(null),
          categories: Joi.array().items(Joi.object()).required(),
        });
  
        const sessionSchema = Joi.object({
          id: Joi.string().required(),
          startedAt: Joi.date().iso(),
          endedAt: Joi.date().iso(),
          location: Joi.string().allow(""),
          description: Joi.string().allow(""),
          threshold: Joi.allow(null),
          onlineLink: Joi.string().allow(null),
          title: Joi.string().required(),
          maxAmount: Joi.object(),
          participants: Joi.object(),
          isEnrolled: Joi.boolean(),
          type: Joi.string(),
          attended: Joi.boolean().required(),
        });
  
        const invoiceSchema = Joi.object({
          name: Joi.string().required(),
          email: Joi.string().required(),
          phone: Joi.string().required(),
          orderProductId: Joi.string().required(),
        });
  
        const responseSchema = Joi.object({
          id: Joi.string().required(),
          activity: activitySchema,
          sessions: Joi.array().items(sessionSchema),
          invoice: invoiceSchema,
        });
  
        const { error } = responseSchema.validate(data);
        expect(error).toBeUndefined();
        expect(data.id).toEqual(insertedActivityTicket1.id);
        expect(data.activity).toEqual({
          id: insertedActivity.id,
          title: insertedActivity.title,
          coverUrl: insertedActivity.coverUrl,
          categories: [
            {
              id: insertedCategory.id,
              name: insertedCategory.name,
            },
          ],
        });
        expect(data.sessions).toEqual([
          {
            id: insertedActivitySession1.id,
            startedAt: "2020-01-01T00:00:00.000Z",
            endedAt: "2020-01-02T00:00:00.000Z",
            location: insertedActivitySession1.location,
            description: insertedActivitySession1.description,
            threshold: insertedActivitySession1.threshold,
            onlineLink: insertedActivitySession1.onlineLink,
            title: insertedActivitySession1.title,
            maxAmount: {
              offline: 1,
              online: 0,
            },
            participants: {
              offline: 1,
              online: 0,
            },
            isEnrolled: true,
            type: insertedActivitySessionTicket1.activitySessionType,
            attended: false,
          },
        ]);
  
        expect(data.invoice).toEqual({
          name: insertedOrderLog.invoiceOptions.name,
          email: insertedOrderLog.invoiceOptions.email,
          phone: insertedOrderLog.invoiceOptions.phone,
          orderProductId: insertedOrderProduct.id,
        });
      });
  
      it("should correctly return two sessions", async () => {
        const insertedActivitySession2 = await createTestActivitySession(
          manager,
          {
            activity: insertedActivity,
            startedAt: new Date("2020-01-01T00:00:00Z"),
            endedAt: new Date("2020-01-02T00:00:00Z"),
          },
        );
  
        const insertedActivitySessionTicket2 =
          await createTestActivitySessionTicket(manager, {
            activitySession: insertedActivitySession2,
            activityTicket: insertedActivityTicket1,
            activitySessionType: "offline",
          });
  
        const jwtSecret = application
          .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
          .getOrThrow("HASURA_JWT_SECRET");
  
        const token = jwt.sign(
          {
            memberId: insertedMember.id,
            permissions: [],
          },
          jwtSecret,
        );
  
        const dto: FetchMemberRightActivityTicketDTO = {
          activityTicketId: insertedActivityTicket1.id,
          sessionId: "",
        };
  
        const { body: data } = await request(application.getHttpServer())
          .get(
            `/activity/member_right?&activityTicketId=${dto.activityTicketId}${dto.sessionId ? `&sessionId=${dto.sessionId}` : ""}`,
          )
          .set("host", appHost.host)
          .set("Authorization", `Bearer ${token}`)
          .expect(200);
  
        const sessionSchema = Joi.array().items(
          Joi.object({
            id: Joi.string().required(),
            startedAt: Joi.date().iso(),
            endedAt: Joi.date().iso(),
            location: Joi.string().allow(""),
            description: Joi.string().allow(""),
            threshold: Joi.allow(null),
            onlineLink: Joi.string().allow(null),
            title: Joi.string().required(),
            maxAmount: Joi.object(),
            participants: Joi.object(),
            isEnrolled: Joi.boolean(),
            type: Joi.string(),
            attended: Joi.boolean().required(),
          }),
        );
  
        const { error } = sessionSchema.validate(data.sessions);
        expect(error).toBeUndefined();
        expect(data.sessions.length).toEqual(2);
      });

      it("should correctly return mutiple category", async () => {
        const insertedCategory2 = await createTestCategory(manager, {
          appId: app.id,
          class: "activity",
        });
  
        const insertedActivityCategory = await createTestActivityCategory(manager, {
          activity: insertedActivity,
          category: insertedCategory2,
        });

        const jwtSecret = application
          .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
          .getOrThrow("HASURA_JWT_SECRET");
  
        const token = jwt.sign(
          {
            memberId: insertedMember.id,
            permissions: [],
          },
          jwtSecret,
        );
  
        const dto: FetchMemberRightActivityTicketDTO = {
          activityTicketId: insertedActivityTicket1.id,
          sessionId: "",
        };
  
        const { body: data } = await request(application.getHttpServer())
          .get(
            `/activity/member_right?&activityTicketId=${dto.activityTicketId}${dto.sessionId ? `&sessionId=${dto.sessionId}` : ""}`,
          )
          .set("host", appHost.host)
          .set("Authorization", `Bearer ${token}`)
          .expect(200);
  

        expect(data.activity.categories.length).toEqual(2);
      });
  
      it("should correctly apply filters, sorting, pagination on the response", async () => {
        const insertedActivitySession2 = await createTestActivitySession(
          manager,
          {
            activity: insertedActivity,
            startedAt: new Date("2020-01-01T00:00:00Z"),
            endedAt: new Date("2020-01-02T00:00:00Z"),
          },
        );
  
        const insertedActivitySessionTicket2 =
          await createTestActivitySessionTicket(manager, {
            activitySession: insertedActivitySession2,
            activityTicket: insertedActivityTicket1,
            activitySessionType: "offline",
          });
  
        const jwtSecret = application
          .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
          .getOrThrow("HASURA_JWT_SECRET");
  
        const token = jwt.sign(
          {
            memberId: insertedMember.id,
            permissions: [],
          },
          jwtSecret,
        );
  
        const dto: FetchMemberRightActivityTicketDTO = {
          activityTicketId: insertedActivityTicket1.id,
          sessionId: insertedActivitySession2.id,
        };
  
        const { body: data } = await request(application.getHttpServer())
          .get(
            `/activity/member_right?&activityTicketId=${dto.activityTicketId}${dto.sessionId ? `&sessionId=${dto.sessionId}` : ""}`,
          )
          .set("host", appHost.host)
          .set("Authorization", `Bearer ${token}`)
          .expect(200);
  
        expect(data.sessions.length).toEqual(1);
        expect(data.sessions[0].id).toEqual(insertedActivitySession2.id);
      });
    });
  
    describe("Negative Testing with Valid Input", () => {
      let insertedMember;
      let insertedUnregisterMember;
      let insertedActivity;
      let insertedCategory;
      let insertedActivityCategory;
      let insertedActivitySession1;
      let insertedActivityTicket1;
      let insertedActivitySessionTicket1;
      let insertedOrderLog;
      let insertedProduct;
      let insertedCurrency;
      let insertedOrderProduct;
  
      beforeEach(async () => {
        insertedMember = await createTestMember(manager, {
          appId: app.id,
          role: "app-owner",
        });
  
        insertedUnregisterMember = await createTestMember(manager, {
          appId: app.id,
          role: "general-member",
        });
  
        insertedActivity = await createTestActivity(manager, {
          app: app,
          organizer: insertedMember,
          isPrivate: false, // scenario: 'holding' condition
          publishedAt: new Date(), // scenario: 'holding' condition
        });
  
        insertedCategory = await createTestCategory(manager, {
          appId: app.id,
          class: "activity",
        });
  
        insertedActivityCategory = await createTestActivityCategory(manager, {
          activity: insertedActivity,
          category: insertedCategory,
        });
  
        insertedActivitySession1 = await createTestActivitySession(manager, {
          activity: insertedActivity,
          startedAt: new Date("2020-01-01T00:00:00Z"),
          endedAt: new Date("2020-01-02T00:00:00Z"),
        });
  
        insertedActivityTicket1 = await createTestActivityTicket(manager, {
          activity: insertedActivity,
          startedAt: new Date("2020-01-01T00:00:00Z"),
          endedAt: new Date("2020-01-02T00:00:00Z"),
        });
  
        insertedActivitySessionTicket1 = await createTestActivitySessionTicket(
          manager,
          {
            activitySession: insertedActivitySession1,
            activityTicket: insertedActivityTicket1,
            activitySessionType: "offline",
          },
        );
  
        insertedOrderLog = await createTestOrderLog(manager, {
          member: insertedMember,
          appId: app.id,
        });
  
        insertedProduct = await createTestProduct(manager, {
          id: `ActivityTicket_${insertedActivityTicket1.id}`,
          type: "ActivityTicket",
          target: insertedActivityTicket1.id,
        });
  
        insertedCurrency = await createTestCurrency(manager, {
          id: "TWD",
        });
  
        insertedOrderProduct = await createTestOrderProduct(manager, {
          order: insertedOrderLog,
          product: insertedProduct,
          currency: insertedCurrency,
          productId: insertedActivity.id,
          options: {
            from: `/activities/${insertedActivity.id}`,
            currencyId: insertedCurrency.id,
            currencyPrice: 2000,
          },
        });
      });
  
      it("should return appropriate error for non-existent resources or illegal operations", async () => {
        const jwtSecret = application
          .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
          .getOrThrow("HASURA_JWT_SECRET");
  
        const token = jwt.sign(
          {
            memberId: insertedUnregisterMember.id,
            permissions: [],
          },
          jwtSecret,
        );
  
        const dto: FetchMemberRightActivityTicketDTO = {
          activityTicketId: insertedActivityTicket1.id,
          sessionId: "",
        };
  
        const { body: res } = await request(application.getHttpServer())
          .get(
            `/activity/member_right?&activityTicketId=${dto.activityTicketId}${dto.sessionId ? `&sessionId=${dto.sessionId}` : ""}`,
          )
          .set("host", appHost.host)
          .set("Authorization", `Bearer ${token}`)
          .expect(400);
  
        expect(res.code).toEqual("E_NOT_FOUND");
  
        expect(res.message).toEqual(
          `Activity ticket data not found, activity_ticket_id: ${dto.activityTicketId}, member_id: ${insertedUnregisterMember.id}, session_id undefined`,
        );
      });
    });
  
    describe("Negative Testing with Invalid Input", () => {
      it("should handle invalid input gracefully (e.g., missing required parameters, invalid UUID)", async () => {
        const jwtSecret = application
          .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
          .getOrThrow("HASURA_JWT_SECRET");
  
        const token = jwt.sign(
          {
            memberId: "invoke_member_id",
            permissions: [],
          },
          jwtSecret,
        );
  
        const dto: FetchMemberRightActivityTicketDTO = {
          activityTicketId: "non_uuid",
          sessionId: "non_uuid",
        };
  
        const { body: res } = await request(application.getHttpServer())
          .get(
            `/activity/member_right?&activityTicketId=${dto.activityTicketId}${dto.sessionId ? `&sessionId=${dto.sessionId}` : ""}`,
          )
          .set("host", appHost.host)
          .set("Authorization", `Bearer ${token}`)
          .expect(400);
  
        expect(res.statusCode).toEqual(400);
        expect(res.message).toEqual([
          "activityTicketId must be a UUID",
          "sessionId must be a UUID",
        ]);
      });
    });
  
    describe("Permission Tests", () => {
      describe("Executing API Calls with Different Permission Levels", () => {
        it("should deny access for users without correct permissions", async () => {
          const dto: FetchMemberRightActivityTicketDTO = {
            activityTicketId: "non_uuid",
            sessionId: "non_uuid",
          };
  
          const { body: res } = await request(application.getHttpServer())
            .get(
              `/activity/member_right?&activityTicketId=${dto.activityTicketId}${dto.sessionId ? `&sessionId=${dto.sessionId}` : ""}`,
            )
            .set("host", appHost.host)
            .expect(401);
  
        });
      });
    });
  });

});
