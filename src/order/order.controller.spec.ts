import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
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

const role = new Role();
role.name = 'app-owner';

const appPlan = new AppPlan();
appPlan.id = v4();
appPlan.name = 'test-plan';
appPlan.description = 'test plan description';

const app = new App();
app.id = 'test';
app.appPlan = appPlan;
app.symbol = 'TST';

const appSetting = new AppSetting();
appSetting.appId = app.id;
appSetting.key = 'auth.service.client_id';
appSetting.value = 'test';

const appSecret = new AppSecret();
appSecret.appId = app.id;
appSecret.key = 'auth.service.key';
appSecret.value = 'testKey';

describe('OrderController (e2e)', () => {
  let application: INestApplication;
  let manager: EntityManager;
  let roleRepo: Repository<Role>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appSecretRepo: Repository<AppSecret>;
  let appSettingRepo: Repository<AppSetting>;
  let memberRepo: Repository<Member>;
  let orderLogRepo: Repository<OrderLog>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderService],
      controllers: [OrderController],
      imports: [ApplicationModule],
    }).compile();

    application = module.createNestApplication();
    manager = application.get<EntityManager>('phdbEntityManager');
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

  afterAll(async () => {
    await orderLogRepo.delete({});
    await memberRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    application.close();
  });

  describe('Order Received Transfer Test ', () => {
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
        .put('/api/v2/order/transfer-received-order')
        .set(requestHeader)
        .send(requestBody)
        .expect(400)
        .expect(/{"statusCode":400,"message":"E_TOKEN_INVALID"/);
    });

    it('should TransferOrderToken is invalid', async () => {
      const tokenResponse = await request(application.getHttpServer())
        .post('/api/v2/auth/token')
        .send({ clientId: 'test', key: 'testKey', permissions: [] });
      const {
        result: { authToken },
      } = tokenResponse.body;

      const requestBody: TransferReceivedOrderBodyDTO = { token: '', memberId: undefined };
      const requestHeader = {
        authorization: 'Bearer ' + authToken,
      };

      await request(application.getHttpServer())
        .put('/api/v2/order/transfer-received-order')
        .set(requestHeader)
        .send(requestBody)
        .expect(400)
        .expect(/{"statusCode":400,"message":"E_TOKEN_INVALID"/);
    });

    it('should orderId is invalid', async () => {
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

      const orderDataToken = await sign(orderData, process.env.HASURA_JWT_SECRET, {
        expiresIn: '30days',
      });

      const tokenResponse = await request(application.getHttpServer())
        .post('/api/v2/auth/token')
        .send({ clientId: 'test', key: 'testKey', permissions: [] });
      const {
        result: { authToken },
      } = tokenResponse.body;

      const requestBody: TransferReceivedOrderBodyDTO = { token: orderDataToken, memberId: secondMember.id };
      const requestHeader = {
        authorization: 'Bearer ' + authToken,
      };

      await request(application.getHttpServer())
        .put('/api/v2/order/transfer-received-order')
        .set(requestHeader)
        .send(requestBody)
        .expect(400)
        .expect(/{"statusCode":400,"message":"E_NULL_ORDER"/);
      await orderLogRepo.delete({});
      await memberRepo.delete({});
    });

    it('should order received transfer success', async () => {
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

      const orderDataToken = await sign(orderData, process.env.HASURA_JWT_SECRET, {
        expiresIn: '30days',
      });

      const tokenResponse = await request(application.getHttpServer())
        .post('/api/v2/auth/token')
        .send({ clientId: 'test', key: 'testKey', permissions: [] });
      const {
        result: { authToken },
      } = tokenResponse.body;

      const requestBody: TransferReceivedOrderBodyDTO = { token: orderDataToken, memberId: secondMember.id };
      const requestHeader = {
        authorization: 'Bearer ' + authToken,
      };

      await request(application.getHttpServer())
        .put('/api/v2/order/transfer-received-order')
        .set(requestHeader)
        .send(requestBody)
        .expect(200)
        .expect({ code: 'SUCCESS', message: { generatedMaps: [], raw: [], affected: 1 } });
      await orderLogRepo.delete({});
      await memberRepo.delete({});
    });
  });
});
