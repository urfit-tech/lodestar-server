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
  merchandise,
  merchandiseSpec,
  merchandiseSpecOrderProduct,
  merchandiseSpecProduct,
  orderLog,
  productInventory,
  role,
} from '../../data';
import { EntityManager, Repository } from 'typeorm';
import { ApiExceptionFilter } from '~/api.filter';
import { App } from '~/app/entity/app.entity';
import { AppHost } from '~/app/entity/app_host.entity';
import { ApplicationModule } from '~/application.module';
import { AppPlan } from '~/entity/AppPlan';
import { Role } from '~/entity/Role';
import { Member } from '~/member/entity/member.entity';
import request from 'supertest';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { CacheService } from '~/utility/cache/cache.service';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { MerchandiseSpec } from '~/merchandise/entity/MerchandiseSpec';
import { OrderLog } from '~/order/entity/order_log.entity';
import { OrderProduct } from '~/order/entity/order_product.entity';
import { Product } from '~/entity/Product';
import { ProductInventory } from '~/entity/ProductInventory';
import { Merchandise } from '~/merchandise/entity/Merchandise';
import { Currency } from '~/entity/Currency';

interface RepositoryMap {
  [key: string]: Repository<any>;
}

describe('MerchandiseSpecController (e2e)', () => {
  let application: INestApplication;
  let manager: EntityManager;
  let cacheService: CacheService;
  let repositories;

  async function initializeRepositories(manager: EntityManager) {
    return {
      orderProductRepo: manager.getRepository(OrderProduct),
      orderLogRepo: manager.getRepository(OrderLog),
      merchandiseSpecRepo: manager.getRepository(MerchandiseSpec),
      merchandiseRepo: manager.getRepository(Merchandise),
      productInventoryRepo: manager.getRepository(ProductInventory),
      productRepo: manager.getRepository(Product),
      memberRepo: manager.getRepository(Member),
      appSettingRepo: manager.getRepository(AppSetting),
      appSecretRepo: manager.getRepository(AppSecret),
      appHostRepo: manager.getRepository(AppHost),
      appRepo: manager.getRepository(App),
      appPlanRepo: manager.getRepository(AppPlan),
      roleRepo: manager.getRepository(Role),
      currencyRepo: manager.getRepository(Currency),
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

  const AUTH_TOKEN_ROUTE = '/auth/token';
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
            maxAge: 30 * 86400 * 1000,
          },
        }),
      )
      .use(cookieParser());

    manager = application.get<EntityManager>(getEntityManagerToken());

    repositories = await initializeRepositories(manager);
    await clearRepositories(repositories);

    await repositories.currencyRepo.save(currency);
    await repositories.roleRepo.save(role);
    await repositories.appPlanRepo.save(appPlan);
    await repositories.appRepo.save(app);
    await repositories.appHostRepo.save(appHost);
    await repositories.appSettingRepo.save(appSetting);
    await repositories.appSecretRepo.save(appSecret);
    await repositories.memberRepo.save(member);
    await repositories.productRepo.save(merchandiseSpecProduct);
    await repositories.merchandiseRepo.save(merchandise);
    await repositories.merchandiseSpecRepo.save(merchandiseSpec);
    await repositories.productInventoryRepo.save(productInventory);
    await repositories.orderLogRepo.save(orderLog);
    await repositories.orderProductRepo.save(merchandiseSpecOrderProduct);

    await application.init();
  });

  afterEach(async () => {
    await clearRepositories(repositories);
    await application.close();
  });

  describe('/merchandise-spec/:merchandiseSpecId/inventory/status (GET)', () => {
    const merchandiseSpecId = merchandiseSpec.id;
    const route = `/merchandise-spec/${merchandiseSpecId}/inventory/status `;

    it('Should throw error with status 400 cause wrong authorization', async () => {
      const response = await request(application.getHttpServer())
        .get(route)
        .set({ Authorization: 'Bearer wrong_token', host: appHost.host })
        .expect(400);

      expect(response.body.code).toEqual('E_MERCHANDISE_SPEC_GET_INVENTORY_STATUS');
    });

    it('Should get the merchandise spec inventory status data', async () => {
      const { requestHeader } = await fetchToken();

      await request(application.getHttpServer()).get(route).set(requestHeader).expect(200);
    });
  });
});
