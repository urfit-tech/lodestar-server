import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { app, appHost, appPlan, member, role } from '../../data';
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
import { ConfigService } from '@nestjs/config';

describe('LeadController (e2e)', () => {
  let application: INestApplication;
  let manager: EntityManager;
  let roleRepo: Repository<Role>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appHostRepo: Repository<AppHost>;
  let memberRepo: Repository<Member>;
  let cacheService: CacheService;
  let configService: ConfigService<{ META_VERIFY_TOKEN: string }>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture.createNestApplication();
    configService = application.get(ConfigService<{ META_VERIFY_TOKEN: string }>);
    cacheService = application.get(CacheService);
    application
      .useGlobalPipes(new ValidationPipe())
      .useGlobalFilters(new ApiExceptionFilter())
      .use(json({ limit: '10mb' }))
      .use(urlencoded({ extended: true, limit: '10mb' }))
      .use(
        session({
          secret: 'kolable-test',
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
    appHostRepo = manager.getRepository(AppHost);
    roleRepo = manager.getRepository(Role);
    memberRepo = manager.getRepository(Member);

    await memberRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await roleRepo.save(role);
    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await appHostRepo.save(appHost);
    await memberRepo.save(member);

    await application.init();
  });

  afterEach(async () => {
    await memberRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await application.close();
  });

  describe('/webhooks/meta/lead/:appId (GET)', () => {
    const appId = member.appId;
    const route = `/webhooks/meta/lead/${appId}`;

    it('Should return challenge', async () => {
      const header = { host: appHost.host };
      const challenge = '1234';

      const { text } = await request(application.getHttpServer())
        .get(`${route}`)
        .query({
          'hub.mode': 'subscribe',
          'hub.challenge': challenge,
          'hub.verify_token': configService.getOrThrow('META_VERIFY_TOKEN'),
        })
        .set(header)
        .expect(200);
      expect(text).toBe(challenge);
    });

    it('Should throw error if verify_token not match', async () => {
      const header = { host: appHost.host };
      const mode = 'subscribe';
      const challenge = '1234';
      const verifyToken = 'wrong_token_' + configService.getOrThrow('META_VERIFY_TOKEN');

      const { body } = await request(application.getHttpServer())
        .get(`${route}`)
        .query({
          'hub.mode': mode,
          'hub.challenge': challenge,
          'hub.verify_token': verifyToken,
        })
        .set(header)
        .expect(400);
      expect(body).toStrictEqual({
        code: 'E_META_VERIFY',
        message: 'invalid verify token',
        result: { mode, challenge, verifyToken },
      });
    });
  });
});
