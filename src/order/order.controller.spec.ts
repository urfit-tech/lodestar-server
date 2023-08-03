import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ApplicationModule } from '~/application.module';
import { TransferReceivedOrderBodyDTO } from './order.type';
import { Role } from '~/entity/Role';
import { Member } from '~/member/entity/member.entity';
import { App } from '~/entity/App';
import { AppPlan } from '~/entity/AppPlan';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { OrderLog } from './entity/order_log.entity';
import { EntityManager, Repository } from 'typeorm';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { v4 } from 'uuid';
import { sign } from 'jsonwebtoken';
import { role, app, appPlan, appSecret, appSetting } from '~/../test/data';
import { ConfigService } from '@nestjs/config';
import { getEntityManagerToken } from '@nestjs/typeorm';

const apiPath = {
  auth: {
    token: '/auth/token',
  },
  order: {
    transferReceivedOrder: '/orders/transfer-received-order',
    orders: '/orders',
  },
};

describe('OrderController (e2e)', () => {
  let application: INestApplication;
  let configService: ConfigService;
  let manager: EntityManager;
  let roleRepo: Repository<Role>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appSecretRepo: Repository<AppSecret>;
  let appSettingRepo: Repository<AppSetting>;
  let memberRepo: Repository<Member>;
  let orderLogRepo: Repository<OrderLog>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = module.createNestApplication();
    configService = application.get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService);
    manager = application.get<EntityManager>(getEntityManagerToken());
    roleRepo = manager.getRepository(Role);
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    appSecretRepo = manager.getRepository(AppSecret);
    appSettingRepo = manager.getRepository(AppSetting);
    memberRepo = manager.getRepository(Member);
    orderLogRepo = manager.getRepository(OrderLog);

    await orderLogRepo.delete({});
    await memberRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await roleRepo.save(role);
    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await appSecretRepo.save(appSecret);
    await appSettingRepo.save(appSetting);

    await application.init();
  });

  afterEach(async () => {
    await orderLogRepo.delete({});
    await memberRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});
    await application.close();
  });

  describe('/orders/transfer-received-order (PUT)', () => {
    const firstMember = new Member();
    firstMember.id = v4();
    firstMember.appId = app.id;
    firstMember.email = 'owner@example.com';
    firstMember.username = 'owner';
    firstMember.role = role.name;
    firstMember.name = 'firstMember';

    const secondMember = new Member();
    secondMember.id = v4();
    secondMember.appId = app.id;
    secondMember.email = 'receiver@example.com';
    secondMember.username = 'receiver';
    secondMember.role = role.name;
    secondMember.name = 'secondMember';

    const orderLog = new OrderLog();
    orderLog.id = app.symbol + '111111111111111';
    orderLog.member = firstMember;
    orderLog.invoiceOptions = {};

    it('should AuthToken is invalid', async () => {
      const requestBody: TransferReceivedOrderBodyDTO = { token: '', memberId: undefined };
      const requestHeader = {
        authorization: 'Bearer ' + '',
      };

      await request(application.getHttpServer())
        .put(apiPath.order.transferReceivedOrder)
        .set(requestHeader)
        .send(requestBody)
        .expect(401);
    });

    it('should TransferOrderToken is invalid', async () => {
      const tokenResponse = await request(application.getHttpServer())
        .post(apiPath.auth.token)
        .send({ clientId: 'test', key: 'testKey', permissions: [] });
      const {
        result: { authToken },
      } = tokenResponse.body;

      const requestBody: TransferReceivedOrderBodyDTO = { token: '', memberId: undefined };
      const requestHeader = {
        authorization: 'Bearer ' + authToken,
      };

      await request(application.getHttpServer())
        .put(apiPath.order.transferReceivedOrder)
        .set(requestHeader)
        .send(requestBody)
        .expect(400)
        .expect(/{"statusCode":400,"message":"E_TOKEN_INVALID"/);
    });

    it('Should raise error due to orderId is not found', async () => {
      await memberRepo.save(firstMember);
      await memberRepo.save(secondMember);
      await orderLogRepo.save(orderLog);
      const orderData = {
        appId: app.id,
        email: '',
        orderLogId: null,
        orderProductId: null,
        title: 'test product',
        ownerName: firstMember.name,
      };

      const orderDataToken = await sign(orderData, configService.get('HASURA_JWT_SECRET'), {
        expiresIn: '30days',
      });

      const tokenResponse = await request(application.getHttpServer())
        .post(apiPath.auth.token)
        .send({ clientId: 'test', key: 'testKey', permissions: [] });
      const {
        result: { authToken },
      } = tokenResponse.body;

      const requestBody: TransferReceivedOrderBodyDTO = { token: orderDataToken, memberId: secondMember.id };
      const requestHeader = {
        authorization: 'Bearer ' + authToken,
      };

      await request(application.getHttpServer())
        .put(apiPath.order.transferReceivedOrder)
        .set(requestHeader)
        .send(requestBody)
        .expect(400)
        .expect(/{"statusCode":400,"message":"E_NULL_ORDER"/);
    });

    it('Should transfer received order successfully', async () => {
      await memberRepo.save(firstMember);
      await memberRepo.save(secondMember);
      await orderLogRepo.save(orderLog);
      const orderData = {
        appId: app.id,
        email: '',
        orderLogId: orderLog.id,
        orderProductId: null,
        title: 'test product',
        ownerName: firstMember.name,
      };

      const orderDataToken = await sign(orderData, configService.get('HASURA_JWT_SECRET'), {
        expiresIn: '30days',
      });

      const tokenResponse = await request(application.getHttpServer())
        .post(apiPath.auth.token)
        .send({ clientId: 'test', key: 'testKey', permissions: [] });
      const {
        result: { authToken },
      } = tokenResponse.body;

      const requestBody: TransferReceivedOrderBodyDTO = { token: orderDataToken, memberId: secondMember.id };
      const requestHeader = {
        authorization: 'Bearer ' + authToken,
      };

      await request(application.getHttpServer())
        .put(apiPath.order.transferReceivedOrder)
        .set(requestHeader)
        .send(requestBody)
        .expect(200)
        .expect({
          code: 'SUCCESS',
          message: 'transfer order successfully',
          result: { generatedMaps: [], raw: [], affected: 1 },
        });
    });
  });

  describe('/orders/:orderId (GET)', () => {
    const member = new Member();
    member.id = v4();
    member.appId = app.id;
    member.email = 'owner@example.com';
    member.username = 'owner';
    member.role = role.name;
    member.name = 'firstMember';

    const orderLog = new OrderLog();
    orderLog.id = app.symbol + '111111111111111';
    orderLog.member = member;
    orderLog.invoiceOptions = {};

    it('should AuthToken is invalid', async () => {
      const requestHeader = {
        authorization: 'Bearer ' + '',
      };

      await request(application.getHttpServer())
        .get(apiPath.order.orders + '/' + orderLog.id)
        .set(requestHeader)
        .expect(401);
    });

    it('should raise error due to order not found', async () => {
      const tokenResponse = await request(application.getHttpServer())
        .post(apiPath.auth.token)
        .send({ clientId: 'test', key: 'testKey', permissions: [] });
      const {
        result: { authToken },
      } = tokenResponse.body;

      const requestHeader = {
        authorization: 'Bearer ' + authToken,
      };

      await request(application.getHttpServer())
        .get(apiPath.order.orders + '/' + null)
        .set(requestHeader)
        .expect(400)
        .expect(/{"statusCode":400,"message":"E_DB_GET_ORDER_NOT_FOUND"}/);
    });

    it('Should get order successfully', async () => {
      await memberRepo.save(member);
      await orderLogRepo.save(orderLog);
      const tokenResponse = await request(application.getHttpServer())
        .post(apiPath.auth.token)
        .send({ clientId: 'test', key: 'testKey', permissions: [] });
      const {
        result: { authToken },
      } = tokenResponse.body;

      const requestHeader = {
        authorization: 'Bearer ' + authToken,
      };

      await request(application.getHttpServer())
        .get(apiPath.order.orders + '/' + orderLog.id)
        .set(requestHeader)
        .expect(200);
    });
  });
});
