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
  orderLog,
  orderProduct,
  program,
  programContent,
  programContentBody,
  programContentProgress,
  programContentSection,
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
import { Program } from '~/entity/Program';
import { ProgramContentSection } from '~/entity/ProgramContentSection';
import { ProgramContentBody } from '~/entity/ProgramContentBody';
import { ProgramContent } from '~/program/entity/program_content.entity';
import { ProgramContentProgress } from '~/entity/ProgramContentProgress';
import { ProgramPlan } from '~/entity/ProgramPlan';
import { Product } from '~/entity/Product';
import { OrderLog } from '~/order/entity/order_log.entity';
import { OrderProduct } from '~/order/entity/order_product.entity';
import { Currency } from '~/entity/Currency';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { CacheService } from '~/utility/cache/cache.service';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

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
  let productRepo: Repository<Product>;
  let programRepo: Repository<Program>;
  let programPlanRepo: Repository<ProgramPlan>;
  let programContentSectionRepo: Repository<ProgramContentSection>;
  let programContentBodyRepo: Repository<ProgramContentBody>;
  let programContentRepo: Repository<ProgramContent>;
  let programContentProgressRepo: Repository<ProgramContentProgress>;
  let orderLogRepo: Repository<OrderLog>;
  let orderProductRepo: Repository<OrderProduct>;
  let currencyRepo: Repository<Currency>;
  let cacheService: CacheService;

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
    productRepo = manager.getRepository(Product);
    programRepo = manager.getRepository(Program);
    programPlanRepo = manager.getRepository(ProgramPlan);
    programContentSectionRepo = manager.getRepository(ProgramContentSection);
    programContentBodyRepo = manager.getRepository(ProgramContentBody);
    programContentRepo = manager.getRepository(ProgramContent);
    programContentProgressRepo = manager.getRepository(ProgramContentProgress);
    orderLogRepo = manager.getRepository(OrderLog);
    orderProductRepo = manager.getRepository(OrderProduct);
    currencyRepo = manager.getRepository(Currency);

    await orderProductRepo.delete({});
    await orderLogRepo.delete({});
    await productRepo.delete({});
    await programPlanRepo.delete({});
    await currencyRepo.delete({});
    await programContentProgressRepo.delete({});
    await programContentRepo.delete({});
    await programContentSectionRepo.delete({});
    await programContentBodyRepo.delete({});
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
    await programPlanRepo.save(programPlan);
    await programContentBodyRepo.save(programContentBody);
    await programContentSectionRepo.save(programContentSection);
    await programContentRepo.save(programContent);
    await programContentProgressRepo.save(programContentProgress);
    await productRepo.save(programPlanProduct);
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
    await productRepo.delete({});
    await programPlanRepo.delete({});
    await currencyRepo.delete({});
    await programContentProgressRepo.delete({});
    await programContentRepo.delete({});
    await programContentSectionRepo.delete({});
    await programContentBodyRepo.delete({});
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
    const route = `/programs`;
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

    it('Should successfully get owned programs by member', async () => {
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

  describe('/programs/expired (GET)', () => {
    const route = `/programs/expired`;
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

    it('Should successfully get expired programs by member', async () => {
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
