import request from 'supertest';
import { v4 } from 'uuid';
import bcrypt from 'bcrypt';
import { EntityManager, Repository } from 'typeorm';
import { json, urlencoded } from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';

import { ApplicationModule } from '~/application.module';
import { AppPlan } from '~/entity/AppPlan';
import { JwtDTO } from '~/auth/auth.dto';
import { LoginDeviceStatus } from '~/auth/device/device.type';
import { App } from '~/app/entity/app.entity';
import { AppHost } from '~/app/entity/app_host.entity';
import { ApiExceptionFilter } from '~/api.filter';
import { CacheService } from '~/utility/cache/cache.service';
import { Member } from '~/member/entity/member.entity';

import { app, appHost, appPlan } from '../data';

describe('AuthController (e2e)', () => {
  let application: INestApplication;
  let cacheService: CacheService;
  let configService: ConfigService;
  let manager: EntityManager;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appHostRepo: Repository<AppHost>;
  let memberRepo: Repository<Member>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    
    application = moduleFixture.createNestApplication();
    cacheService = application.get(CacheService);
    configService = application.get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService);

    application.useGlobalPipes(new ValidationPipe())
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
    memberRepo = manager.getRepository(Member);

    await memberRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    
    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await appHostRepo.save(appHost);
    
    await application.init();
  });

  afterEach(async () => {
    await memberRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    
    await application.close()
  })

  describe('/auth/general-login (POST)', () => {
    const route = '/auth/general-login';

    it('Should raise error due to incorrect payload', async () => {
      const { body } = await request(application.getHttpServer())
        .post(route)
        .set('host', appHost.host)
        .send({})
        .expect(400);
      expect(body).toStrictEqual({
        statusCode: 400,
        message: [
          'appId must be a string',
          'account must be a string',
          'password must be a string'
        ],
        error: 'Bad Request',
      });
    });

    it('Should raise error due to not exists member', async () => {
      const { body } = await request(application.getHttpServer())
        .post(route)
        .set('host', appHost.host)
        .send({
          appId: app.id,
          account: 'not_exists_account',
          password: 'not_exists_hash',
        })
        .expect(201);
      expect(body).toStrictEqual({
        code: 'E_NO_MEMBER',
        message: 'no such member',
      });
    });

    it('Should raise error due to wrong password', async () => {
      const testMember = new Member();
      testMember.appId = app.id;
      testMember.id = v4();
      testMember.role = 'general-member';
      testMember.email = 'test-wrong-password@example.com';
      testMember.username = 'test-wrong-password';
      testMember.passhash = bcrypt.hashSync('test_password', 1);
      await manager.save(testMember);

      const { body } = await request(application.getHttpServer())
        .post(route)
        .set('host', appHost.host)
        .send({
          appId: app.id,
          account: testMember.username,
          password: 'wrong_password',
        })
        .expect(201);

      expect(body).toStrictEqual({
        code: 'E_PASSWORD',
        message: 'password does not match',
      });
    });

    it('Should raise error due to password reset', async () => {
      const testNoPwdMember = new Member();
      testNoPwdMember.appId = app.id;
      testNoPwdMember.id = v4();
      testNoPwdMember.role = 'general-member';
      testNoPwdMember.email = 'test-no-password@example.com';
      testNoPwdMember.username = 'test-no-password';

      await manager.save(testNoPwdMember);
            const { body } = await request(application.getHttpServer())
        .post(route)
        .set('host', appHost.host)
        .send({
          appId: app.id,
          account: testNoPwdMember.username,
          password: 'wrong_password',
        })
        .expect(201);

      expect(body).toStrictEqual({
        code: 'I_RESET_PASSWORD',
        message: 'please get reset password email',
      });
    });

    it('Should raise error due to business module is off', async () => {
      const testNoBusinessMember = new Member();
      testNoBusinessMember.appId = app.id;
      testNoBusinessMember.id = v4();
      testNoBusinessMember.role = 'general-member';
      testNoBusinessMember.email = 'test-business-password@example.com';
      testNoBusinessMember.username = 'test-business-password';
      testNoBusinessMember.passhash = bcrypt.hashSync('test_password', 1);
      testNoBusinessMember.isBusiness = true;
      await manager.save(testNoBusinessMember);

      const { body } = await request(application.getHttpServer())
        .post(route)
        .set('host', appHost.host)
        .send({
          appId: app.id,
          account: testNoBusinessMember.username,
          password: 'test_password',
        })
        .expect(201);

      expect(body).toStrictEqual({
        code: 'E_NO_MODULE',
        message: 'business_member module disabled',
      });
    });

    describe('Without login restriction & device management', () => {
      it('Should successfully login', async () => {
        const testLoginMember = new Member();
        testLoginMember.appId = app.id;
        testLoginMember.id = v4();
        testLoginMember.role = 'general-member';
        testLoginMember.email = 'test-login-member@example.com';
        testLoginMember.username = 'test-login-member';
        testLoginMember.passhash = bcrypt.hashSync('test_password', 1);
        await manager.save(testLoginMember);

        const { body } = await request(application.getHttpServer())
          .post(route)
          .set('host', appHost.host)
          .send({
            appId: app.id,
            account: testLoginMember.username,
            password: 'test_password',
          })
          .expect(201);
        const { code, message, result } = body;
        const {authToken, deviceStatus } = result;
        expect(code).toBe('SUCCESS');
        expect(message).toBe('login successfully');
        expect(authToken).not.toBeUndefined();
        expect(deviceStatus).toBe(LoginDeviceStatus.UNSUPPORTED);

        const jwtSecret = configService.getOrThrow('HASURA_JWT_SECRET');
        const deserializedToken: JwtDTO = jwt.verify(authToken, jwtSecret) as JwtDTO;
        expect(deserializedToken.sub).toBe(testLoginMember.id);
        expect(deserializedToken.appId).toBe(app.id);
        expect(deserializedToken.memberId).toBe(testLoginMember.id);
        expect(deserializedToken.username).toBe(testLoginMember.username);
        expect(deserializedToken.email).toBe(testLoginMember.email);
        expect(deserializedToken.loggedInMembers.length).toBeGreaterThan(0);

        const [firstMember] = deserializedToken.loggedInMembers;
        expect(firstMember.appId).toBe(app.id);
        expect(firstMember.id).toBe(testLoginMember.id);
        expect(firstMember.email).toBe(testLoginMember.email);
        expect(firstMember.username).toBe(testLoginMember.username);
      });
    });
  });

  describe('/auth/token (POST)', () => {
    const route = '/auth/token';

    it('Should return E_NOT_FOUND error', async () => {
      const { body } = await request(application.getHttpServer())
        .post(route)
        .set('host', appHost.host)
        .send({
          clientId: 'not_exists',
          key: 'not_exists',
          permissions: [],
        })
        .expect(400);
      
      expect(body).toStrictEqual({
        code: 'E_NOT_FOUND',
        message: 'client ID doesn\'t exist',
        result: null,
      });
    });

    // TODO:
    //   After Hasura containerize, build test set and uncomment code below.
    // it('Should return E_AUTH_TOKEN error', async () => {
    //   const { body } = await request(app.getHttpServer())
    //     .post('/auth/token')
    //     .send({
    //       clientId: 'not_exists',
    //       key: 'not_exists',
    //       permissions: [],
    //     })
    //     .expect(400);
      
    //   expect(body).toStrictEqual({
    //     code: 'E_AUTH_TOKEN',
    //     message: 'key is not authenticated',
    //     result: null,
    //   });
    // });

    // it('Should return authToken', async () => {
    //   const { body } = await request(app.getHttpServer())
    //     .post('/auth/token')
    //     .send({
    //       clientId: 'not_exists',
    //       key: 'not_exists',
    //       permissions: [],
    //     })
    //     .expect(200);
      
    //   const { authToken } = body;
    //   expect(body).toStrictEqual({
    //     code: 'SUCCESS',
    //     message: 'get auth token successfully',
    //     result: { authToken },
    //   });
    // });
  });
});