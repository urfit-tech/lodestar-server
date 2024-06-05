import { EntityManager, Repository } from 'typeorm';
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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
import { CacheService } from '~/utility/cache/cache.service';
import { json, urlencoded } from 'express';
import {
  role,
  app,
  appPlan,
  appSecret,
  appSetting,
  appHost,
  member,
  orderLog,
  orderProduct,
  programPlanProduct,
  programPlan,
  programPackagePlan,
  programPackagePlanProduct,
  program,
  programPackage,
  programPackageProgram,
  currency,
} from '../data';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { ApiExceptionFilter } from '~/api.filter';
import bcrypt from 'bcrypt';
import { v4 } from 'uuid';
import cookieParser from 'cookie-parser';
import { OrderLog } from '~/order/entity/order_log.entity';
import { OrderProduct } from '~/order/entity/order_product.entity';
import dayjs from 'dayjs';
import { ProgramPackagePlan } from '~/entity/ProgramPackagePlan';
import { ProgramTempoDelivery } from '~/entity/ProgramTempoDelivery';
import { ProgramPackage } from '~/entity/ProgramPackage';
import { ProgramPackageProgram } from '~/entity/ProgramPackageProgram';
import { Program } from '~/entity/Program';
import { ProgramPlan } from '~/program/entity/ProgramPlan';
import { Currency } from '~/entity/Currency';

const apiPath = {
  auth: {
    generalLogin: '/auth/general-login',
  },
};

describe('EquityController (e2e)', () => {
  let application: INestApplication;
  let manager: EntityManager;
  let roleRepo: Repository<Role>;
  let memberRepo: Repository<Member>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appHostRepo: Repository<AppHost>;
  let appSecretRepo: Repository<AppSecret>;
  let appSettingRepo: Repository<AppSetting>;
  let cacheService: CacheService;
  let orderLogRepo: Repository<OrderLog>;
  let orderProductRepo: Repository<OrderProduct>;
  let programRepo: Repository<Program>;
  let programPlanRepo: Repository<ProgramPlan>;
  let programPackagePlanRepo: Repository<ProgramPackagePlan>;
  let programTempoDeliveryRepo: Repository<ProgramTempoDelivery>;
  let programPackageRepo: Repository<ProgramPackage>;
  let programPackageProgramRepo: Repository<ProgramPackageProgram>;
  let currencyRepo: Repository<Currency>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture.createNestApplication();
    cacheService = application.get(CacheService);
    application
      .useGlobalPipes(new ValidationPipe())
      .useGlobalFilters(new ApiExceptionFilter())
      .use(json({ limit: '10mb' }))
      .use(urlencoded({ extended: true, limit: '10mb' }))
      .use(
        session({
          secret: process.env.SESSION_SECRET,
          store: new RedisStore({ client: cacheService.getClient() }),
          resave: false,
          saveUninitialized: false,
          cookie: {
            httpOnly: true,
            sameSite: 'strict',
            secure: false,
            maxAge: 30 * 86400 * 1000, // 30 days
          },
        }),
      )
      .use(cookieParser());

    manager = application.get<EntityManager>(getEntityManagerToken());
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    appSettingRepo = manager.getRepository(AppSetting);
    appSecretRepo = manager.getRepository(AppSecret);
    appHostRepo = manager.getRepository(AppHost);
    roleRepo = manager.getRepository(Role);
    memberRepo = manager.getRepository(Member);
    orderLogRepo = manager.getRepository(OrderLog);
    orderProductRepo = manager.getRepository(OrderProduct);
    programRepo = manager.getRepository(Program);
    programPlanRepo = manager.getRepository(ProgramPlan);
    programPackageRepo = manager.getRepository(ProgramPackage);
    programPackageProgramRepo = manager.getRepository(ProgramPackageProgram);
    programTempoDeliveryRepo = manager.getRepository(ProgramTempoDelivery);
    programPackagePlanRepo = manager.getRepository(ProgramPackagePlan);
    currencyRepo = manager.getRepository(Currency);

    await orderProductRepo.delete({});
    await orderLogRepo.delete({});
    await programPlanRepo.delete({});
    await programTempoDeliveryRepo.delete({});
    await programPackageProgramRepo.delete({});
    await programPackagePlanRepo.delete({});
    await programPackageRepo.delete({});
    await currencyRepo.delete({});
    await programRepo.delete({});
    await memberRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await currencyRepo.save(currency);
    await roleRepo.save(role);
    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await appSettingRepo.save(appSetting);
    await appSecretRepo.save(appSecret);
    await appHostRepo.save(appHost);
    await memberRepo.save(member);
    await programRepo.save(program);
    await programPackageRepo.save(programPackage);
    await programPlanRepo.save(programPlan);
    await programPackageProgramRepo.save(programPackageProgram);
    await programPackagePlanRepo.save(programPackagePlan);
    await orderLogRepo.save(orderLog);
    orderProduct.productId = programPlanProduct.id;
    orderProduct.name = programPlan.title;
    orderProduct.price = programPlan.listPrice;
    await orderProductRepo.save(orderProduct);

    await application.init();
  });
  afterEach(async () => {
    await orderProductRepo.delete({});
    await orderLogRepo.delete({});
    await programPlanRepo.delete({});
    await programTempoDeliveryRepo.delete({});
    await programPackageProgramRepo.delete({});
    await programPackagePlanRepo.delete({});
    await programPackageRepo.delete({});
    await currencyRepo.delete({});
    await programRepo.delete({});
    await memberRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await application.close();
  });
  describe('/programs (GET)', () => {
    const route = `/equity/programs`;
    const password = 'test_password';

    const testGeneralMember = new Member();
    testGeneralMember.id = v4();
    testGeneralMember.appId = app.id;
    testGeneralMember.email = 'general-member@example.com';
    testGeneralMember.username = 'general-member';
    testGeneralMember.role = 'general-member';
    testGeneralMember.passhash = bcrypt.hashSync('test_password', 1);

    const testGeneralMemberOrderLog = new OrderLog();
    testGeneralMemberOrderLog.id = 'TES1234567891';
    testGeneralMemberOrderLog.appId = testGeneralMember.appId;
    testGeneralMemberOrderLog.memberId = testGeneralMember.id;
    testGeneralMemberOrderLog.status = 'SUCCESS';
    testGeneralMemberOrderLog.invoiceOptions = {};

    const testGeneralMemberOrderProduct = new OrderProduct();
    testGeneralMemberOrderProduct.id = v4();
    testGeneralMemberOrderProduct.name = 'test program plan product';
    testGeneralMemberOrderProduct.orderId = testGeneralMemberOrderLog.id;
    testGeneralMemberOrderProduct.price = 0;
    testGeneralMemberOrderProduct.deliveredAt = dayjs().subtract(1, 'day').toDate();

    it('Should raise error due to unauthorized', async () => {
      const header = { host: appHost.host };

      request(application.getHttpServer())
        .get(`${route}`)
        .set(header)
        .expect({ statusCode: 401, message: 'Unauthorized' });
    });

    it(`Should return empty to member's role is general-member and haven't order`, async () => {
      await memberRepo.save(testGeneralMember);

      const { body } = await request(application.getHttpServer())
        .post(apiPath.auth.generalLogin)
        .set('host', appHost.host)
        .send({
          appId: testGeneralMember.appId,
          account: testGeneralMember.email,
          password: password,
        })
        .expect(201);
      const { authToken } = body.result;

      const header = { authorization: `Bearer ${authToken}`, host: appHost.host };

      const result = await request(application.getHttpServer()).get(`${route}`).set(header);

      expect(result.body).toEqual([]);
    });

    it(`Should return successfully to member's role is general-member and have program plan order`, async () => {
      testGeneralMemberOrderProduct.productId = programPlanProduct.id;

      await memberRepo.save(testGeneralMember);
      await orderLogRepo.save(testGeneralMemberOrderLog);
      await orderProductRepo.save(testGeneralMemberOrderProduct);

      const { body } = await request(application.getHttpServer())
        .post(apiPath.auth.generalLogin)
        .set('host', appHost.host)
        .send({
          appId: testGeneralMember.appId,
          account: testGeneralMember.email,
          password: password,
        })
        .expect(201);
      const { authToken } = body.result;

      const header = { authorization: `Bearer ${authToken}`, host: appHost.host };

      const result = await request(application.getHttpServer()).get(`${route}`).set(header);

      expect(200).toEqual(result.status);
    });

    it(`Should return successfully to member's role is general-member and have program package plan order`, async () => {
      programPackagePlan.isTempoDelivery = false;
      testGeneralMemberOrderProduct.productId = programPackagePlanProduct.id;

      await memberRepo.save(testGeneralMember);
      await programPackagePlanRepo.save(programPackagePlan);
      await orderLogRepo.save(testGeneralMemberOrderLog);
      await orderProductRepo.save(testGeneralMemberOrderProduct);

      const { body } = await request(application.getHttpServer())
        .post(apiPath.auth.generalLogin)
        .set('host', appHost.host)
        .send({
          appId: testGeneralMember.appId,
          account: testGeneralMember.email,
          password: password,
        })
        .expect(201);
      const { authToken } = body.result;

      const header = { authorization: `Bearer ${authToken}`, host: appHost.host };

      const result = await request(application.getHttpServer()).get(`${route}`).set(header);

      expect(200).toEqual(result.status);
    });

    it(`Should return successfully to member's role is general-member and have program package plan order and program package plan is tempo delivery`, async () => {
      programPackagePlan.isTempoDelivery = true;
      testGeneralMemberOrderProduct.productId = programPackagePlanProduct.id;

      const programTempoDelivery = new ProgramTempoDelivery();
      programTempoDelivery.id = v4();
      programTempoDelivery.memberId = testGeneralMember.id;
      programTempoDelivery.programPackageProgramId = programPackageProgram.id;
      programTempoDelivery.deliveredAt = dayjs().subtract(1, 'day').toDate();

      await memberRepo.save(testGeneralMember);
      await programPackagePlanRepo.save(programPackagePlan);
      await orderLogRepo.save(testGeneralMemberOrderLog);
      await orderProductRepo.save(testGeneralMemberOrderProduct);
      await programTempoDeliveryRepo.save(programTempoDelivery);

      const { body } = await request(application.getHttpServer())
        .post(apiPath.auth.generalLogin)
        .set('host', appHost.host)
        .send({
          appId: testGeneralMember.appId,
          account: testGeneralMember.email,
          password: password,
        })
        .expect(201);
      const { authToken } = body.result;

      const header = { authorization: `Bearer ${authToken}`, host: appHost.host };

      const result = await request(application.getHttpServer()).get(`${route}`).set(header);

      expect(200).toEqual(result.status);
    });
  });
});
