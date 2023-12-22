import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import {
  app,
  appHost,
  appPlan,
  appSecret,
  appSetting,
  currency,
  member,
  program,
  programPlan,
  programPlanProduct,
  role,
  voucher,
  voucherCode,
  voucherPlan,
  voucherPlanProduct,
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
import { Voucher } from '~/voucher/entity/voucher.entity';
import { VoucherCode } from '~/entity/VoucherCode';
import { VoucherPlan } from '~/entity/VoucherPlan';
import { VoucherPlanProduct } from '~/entity/VoucherPlanProduct';
import { Product } from '~/entity/Product';
import { Program } from '~/entity/Program';
import { ProgramPlan } from '~/entity/ProgramPlan';

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
  let voucherRepo: Repository<Voucher>;
  let voucherCodeRepo: Repository<VoucherCode>;
  let voucherPlanRepo: Repository<VoucherPlan>;
  let voucherPlanProductRepo: Repository<VoucherPlanProduct>;
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
    voucherRepo = manager.getRepository(Voucher);
    voucherCodeRepo = manager.getRepository(VoucherCode);
    voucherPlanRepo = manager.getRepository(VoucherPlan);
    voucherPlanProductRepo = manager.getRepository(VoucherPlanProduct);
    productRepo = manager.getRepository(Product);
    programRepo = manager.getRepository(Program);
    programPlanRepo = manager.getRepository(ProgramPlan);

    await voucherPlanProductRepo.delete({});
    await productRepo.delete({});
    await programPlanRepo.delete({});
    await programRepo.delete({});
    await voucherRepo.delete({});
    await voucherCodeRepo.delete({});
    await voucherPlanRepo.delete({});
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
    await voucherPlanRepo.save(voucherPlan);
    await voucherCodeRepo.save(voucherCode);
    await voucherRepo.save(voucher);
    await voucherPlanProductRepo.save(voucherPlanProduct);

    await application.init();
  });

  afterEach(async () => {
    await voucherPlanProductRepo.delete({});
    await productRepo.delete({});
    await programPlanRepo.delete({});
    await programRepo.delete({});
    await voucherRepo.delete({});
    await voucherCodeRepo.delete({});
    await voucherPlanRepo.delete({});
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

  describe('/voucher (GET)', () => {
    const route = `/vouchers`;
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

    it('Should successfully get owned vouchers by member', async () => {
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
