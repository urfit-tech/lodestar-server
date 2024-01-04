import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import {
  app,
  appHost,
  appPlan,
  appSecret,
  appSetting,
  coupon,
  couponCode,
  couponPlan,
  couponPlanProduct,
  currency,
  member,
  program,
  programPlan,
  programPlanProduct,
  role,
} from '../data';
import { EntityManager, Repository } from 'typeorm';
import { ApiExceptionFilter } from '~/api.filter';
import { App } from '~/app/entity/app.entity';
import { AppHost } from '~/app/entity/app_host.entity';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { ApplicationModule } from '~/application.module';
import { AppPlan } from '~/entity/AppPlan';
import { Role } from '~/entity/Role';
import { Member } from '~/member/entity/member.entity';
import request from 'supertest';
import { Currency } from '~/entity/Currency';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { CacheService } from '~/utility/cache/cache.service';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

import { Product } from '~/entity/Product';
import { Program } from '~/entity/Program';
import { ProgramPlan } from '~/entity/ProgramPlan';
import { Coupon } from '~/coupon/entity/coupon.entity';
import { CouponCode } from '~/entity/CouponCode';
import { CouponPlan } from '~/entity/CouponPlan';
import { CouponPlanProduct } from '~/entity/CouponPlanProduct';

describe('ProgramController (e2e)', () => {
  let application: INestApplication;
  let manager: EntityManager;
  let roleRepo: Repository<Role>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appHostRepo: Repository<AppHost>;
  let appSecretRepo: Repository<AppSecret>;
  let appSettingRepo: Repository<AppSetting>;
  let memberRepo: Repository<Member>;
  let currencyRepo: Repository<Currency>;
  let cacheService: CacheService;
  let couponRepo: Repository<Coupon>;
  let couponCodeRepo: Repository<CouponCode>;
  let couponPlanRepo: Repository<CouponPlan>;
  let couponPlanProductRepo: Repository<CouponPlanProduct>;
  let productRepo: Repository<Product>;
  let programRepo: Repository<Program>;
  let programPlanRepo: Repository<ProgramPlan>;

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
            secure: true,
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
    currencyRepo = manager.getRepository(Currency);
    couponRepo = manager.getRepository(Coupon);
    couponCodeRepo = manager.getRepository(CouponCode);
    couponPlanRepo = manager.getRepository(CouponPlan);
    couponPlanProductRepo = manager.getRepository(CouponPlanProduct);
    productRepo = manager.getRepository(Product);
    programRepo = manager.getRepository(Program);
    programPlanRepo = manager.getRepository(ProgramPlan);

    await couponPlanProductRepo.delete({});
    await productRepo.delete({});
    await programPlanRepo.delete({});
    await programRepo.delete({});
    await couponRepo.delete({});
    await couponCodeRepo.delete({});
    await couponPlanRepo.delete({});
    await currencyRepo.delete({});
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
    await programPlanRepo.save(programPlan);
    await productRepo.save(programPlanProduct);
    await couponPlanRepo.save(couponPlan);
    await couponCodeRepo.save(couponCode);
    await couponRepo.save(coupon);
    await couponPlanProductRepo.save(couponPlanProduct);

    await application.init();
  });

  afterEach(async () => {
    await couponPlanProductRepo.delete({});
    await productRepo.delete({});
    await programPlanRepo.delete({});
    await programRepo.delete({});
    await couponRepo.delete({});
    await couponCodeRepo.delete({});
    await couponPlanRepo.delete({});
    await currencyRepo.delete({});
    await memberRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await application.close();
  });

  describe('/coupon (GET)', () => {
    const route = `/coupons`;
    const appId = member.appId;
    const email = member.email;
    const password = 'test_password';

    it('Should raise error due to unauthorized', async () => {
      const header = { host: appHost.host };

      request(application.getHttpServer())
        .get(`${route}`)
        .set(header)
        .expect({ statusCode: 401, message: 'Unauthorized' });
    });

    it('Should successfully get owned coupons by member', async () => {
      const {
        body: {
          result: { authToken },
        },
      } = await request(application.getHttpServer()).post('/auth/general-login').set('host', appHost.host).send({
        appId,
        account: email,
        password: password,
      });

      const header = { authorization: `Bearer ${authToken}`, host: appHost.host };

      const result = await request(application.getHttpServer()).get(`${route}`).set(header);

      expect(200).toEqual(result.status);
    });
  });
});
