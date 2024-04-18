import { EntityManager, Repository } from 'typeorm';
import request from 'supertest';
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
import Joi from 'joi';
import { FetchMemberRightActivityTicketDTO } from '~/equity/dto/equity-activity-ticket.dto';
interface RepositoryMap {
  [key: string]: Repository<any>;
}

const AUTH_TOKEN_ROUTE = '/auth/token';

describe('EquityController (e2e)', () => {
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


  describe("GET /activity_ticket", () => {
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
          publishedAt: new Date(), // scenario: 'holding' condition,
          isParticipantsVisible: true
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
  
      it("should successfully retrieve member rights for a valid activity ticket", async () => {
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
            `/equity/activity_ticket?&activityTicketId=${dto.activityTicketId}${dto.sessionId ? `&sessionId=${dto.sessionId}` : ""}`,
          )
          .set("host", appHost.host)
          .set("Authorization", `Bearer ${token}`)
          .expect(200);
  
        expect(response.status).toBe(200);
      });
  
      it("should return a valid JSON response that matches the expected schema", async () => {
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
            `/equity/activity_ticket?&activityTicketId=${dto.activityTicketId}${dto.sessionId ? `&sessionId=${dto.sessionId}` : ""}`,
          )
          .set("host", appHost.host)
          .set("Authorization", `Bearer ${token}`)
          .expect(200);
  
        const activitySchema = Joi.object({
          id: Joi.string().required(),
          title: Joi.string().required(),
          coverUrl: Joi.string().allow(null),
          categories: Joi.array().items(Joi.object()).required(),
          isParticipantsVisible: Joi.boolean().required()
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
          isParticipantsVisible: true
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
  
      it("should include all associated sessions in the response", async () => {
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
            `/equity/activity_ticket?&activityTicketId=${dto.activityTicketId}${dto.sessionId ? `&sessionId=${dto.sessionId}` : ""}`,
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

      it("should include all associated categories in the activity response", async () => {
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
            `/equity/activity_ticket?&activityTicketId=${dto.activityTicketId}${dto.sessionId ? `&sessionId=${dto.sessionId}` : ""}`,
          )
          .set("host", appHost.host)
          .set("Authorization", `Bearer ${token}`)
          .expect(200);
  

        expect(data.activity.categories.length).toEqual(2);
      });
  
      it("should apply filters and return only the specified session in the response", async () => {
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
            `/equity/activity_ticket?&activityTicketId=${dto.activityTicketId}${dto.sessionId ? `&sessionId=${dto.sessionId}` : ""}`,
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
  
      it("should return an error when the member does not have access to the activity ticket", async () => {
        const logSpy = jest.spyOn(console, 'error');

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
            `/equity/activity_ticket?&activityTicketId=${dto.activityTicketId}${dto.sessionId ? `&sessionId=${dto.sessionId}` : ""}`,
          )
          .set("host", appHost.host)
          .set("Authorization", `Bearer ${token}`)
          .expect(400);
  
        expect(res.code).toEqual("E_NOT_FOUND");
  
        expect(res.message).toEqual(
          `Activity ticket data not found, activity_ticket_id: ${dto.activityTicketId}, member_id: ${insertedUnregisterMember.id}, session_id undefined`,
        );

        expect(logSpy).toHaveBeenCalled();
        expect(logSpy).toBeCalledTimes(1);
        logSpy.mockRestore();
      });
    });
  
    describe("Negative Testing with Invalid Input", () => {
      it("should return a validation error for missing or invalid parameters)", async () => {
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
            `/equity/activity_ticket?&activityTicketId=${dto.activityTicketId}${dto.sessionId ? `&sessionId=${dto.sessionId}` : ""}`,
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
        it("should return an unauthorized error for users without the necessary permissions", async () => {
          const dto: FetchMemberRightActivityTicketDTO = {
            activityTicketId: "non_uuid",
            sessionId: "non_uuid",
          };
  
          const { body: res } = await request(application.getHttpServer())
            .get(
              `/equity/activity_ticket?&activityTicketId=${dto.activityTicketId}${dto.sessionId ? `&sessionId=${dto.sessionId}` : ""}`,
            )
            .set("host", appHost.host)
            .expect(401);
  
        });
      });
    });
  });

});
