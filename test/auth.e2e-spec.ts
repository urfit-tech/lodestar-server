import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PostgresModule } from '~/database/postgres.module';
import { AuthModule } from '~/auth/auth.module';
import { EntityManager, Repository } from 'typeorm';
import { Role } from '~/entity/Role';
import { AppPlan } from '~/entity/AppPlan';
import { App } from '~/entity/App';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { Member } from '~/member/entity/member.entity';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { app, appPlan, appSecret, appSetting, member, role } from './data';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { AuthAuditLog } from '~/auth/entity/auth_audit_log.entity';
import { CacheService } from '~/utility/cache/cache.service';

describe('AuthController (e2e)', () => {
  let application: INestApplication;
  let manager: EntityManager;
  let roleRepo: Repository<Role>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let memberRepo: Repository<Member>;
  let authAutditLogRepo: Repository<AuthAuditLog>;
  let appSettingRepo: Repository<AppSetting>;
  let appSecretRepo: Repository<AppSecret>;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PostgresModule.forRootAsync(), AuthModule],
    }).compile();

    application = module.createNestApplication();
    cacheService = application.get<CacheService>(CacheService);

    manager = application.get<EntityManager>(getEntityManagerToken());
    roleRepo = manager.getRepository(Role);
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    memberRepo = manager.getRepository(Member);
    appSettingRepo = manager.getRepository(AppSetting);
    appSecretRepo = manager.getRepository(AppSecret);
    authAutditLogRepo = manager.getRepository(AuthAuditLog);

    await authAutditLogRepo.delete({});
    await memberRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await roleRepo.save(role);
    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await memberRepo.save(member);
    await appSettingRepo.save(appSetting);
    await appSecretRepo.save(appSecret);
    await application.init();
  });

  afterEach(async () => {
    await authAutditLogRepo.delete({});
    await memberRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await application.close();
  });

  describe('/auth/token (POST)', () => {
    const route = '/auth/token';

    it('Should return E_NOT_FOUND error', async () => {
      const { body } = await request(application.getHttpServer())
        .post(route)
        .send({
          clientId: 'not_exists',
          key: 'not_exists',
          permissions: [],
        })
        .expect(400);

      expect(body).toStrictEqual({
        statusCode: 400,
        message: 'E_NOT_FOUND',
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

  describe('/auth/password/temporary (POST)', () => {
    const route = '/auth/password/temporary';

    it('should successfully retrieve a temporary password', async () => {
      const appId = member.appId;
      const email = member.email;
      const applicant = member.id;

      const { body } = await request(application.getHttpServer()).post(route).send({
        appId,
        applicant,
        email,
        purpose: 'test',
      });

      expect(body.code).toBe('SUCCESS');
      expect(body.result.password).toBeDefined();

      const authAuditLog = await manager.getRepository(AuthAuditLog).findOne({ where: { memberId: applicant } });

      expect(authAuditLog.action).toBe('apply_temporary_password');

      const redisPassword = await cacheService.getClient().get(`tmpPass:${appId}:${email}`);

      expect(redisPassword).toBe(body.result.password);
    });

    it(`should fail due to member doesn't exist`, async () => {
      const { body } = await request(application.getHttpServer()).post(route).send({
        appId: 'test',
        applicant: member.id,
        email: 'test_nonexist@example.com',
        purpose: 'test',
      });
      expect(body).toStrictEqual({
        code: 'E_TMP_PASSWORD',
        message: 'failed to generate temporary password',
        result: null,
      });
    });

    it.skip('should successfully login with a temporary password', () => {
      // genearl-login
    });
  });
});
