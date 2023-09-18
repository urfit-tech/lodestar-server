import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PostgresModule } from '~/database/postgres.module';
import { ApiExceptionFilter } from '~/api.filter';
import { AuthModule } from '~/auth/auth.module';
import { EntityManager, Repository } from 'typeorm';
import { Role } from '~/entity/Role';
import { AppPlan } from '~/entity/AppPlan';
import { AppExtendedModule } from '~/entity/AppExtendedModule';
import { App } from '~/entity/App';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { Member } from '~/member/entity/member.entity';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { app, appPlan, appSecret, appSetting, member, role } from './data';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { v4 } from 'uuid';
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
    authAutditLogRepo = manager.getRepository(AuthAuditLog);

    await authAutditLogRepo.delete({});
    await memberRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await roleRepo.save(role);
    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await memberRepo.save(member);
    await application.init();
  });

  afterEach(async () => {
    await authAutditLogRepo.delete({});
    await memberRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await application.close();
  });

  describe('/auth/password/temporary (POST)', () => {
    const route = '/auth/password/temporary';

    it('should return E_NO_MEMBER error', async () => {
      const { body } = await request(application.getHttpServer()).post(route).send({
        appId: 'test',
        applicant: member.id,
        email: 'test_nonexist@example.com',
        purpose: 'test',
      });

      expect(body).toStrictEqual({
        code: 'E_NO_MEMBER',
        message: 'member not found',
        result: null,
      });
    });

    it('should successfully retrieve a temporary password', async () => {
      const { body } = await request(application.getHttpServer()).post(route).send({
        appId: member.appId,
        applicant: member.id,
        email: member.email,
        purpose: 'test',
      });

      expect(body.code).toBe('SUCCESS');
      expect(body.result.password).toBeDefined();
    });

    it('should fail to retrieve a temporary password', async () => {
      const { body } = await request(application.getHttpServer()).post(route).send({
        appId: 'test',
        email: 'test@example.com',
        purpose: 'test',
      });
      expect(body).toStrictEqual({
        code: 'E_TMP_PASSWORD',
        message: 'failed to generate temporary password',
        result: null,
      });
    });

    it('should insert an audit log', async () => {
      const applicant = member.id;
      await request(application.getHttpServer()).post(route).send({
        appId: member.appId,
        applicant,
        email: member.email,
        purpose: 'test',
      });

      const authAuditLog = await manager.getRepository(AuthAuditLog).findOne({ where: { memberId: member.id } });

      expect(authAuditLog.action).toBe('apply_temporary_password');
    });

    it('should insert the temporary password into Redis', async () => {
      const appId = member.appId;
      const email = member.email;

      const { body } = await request(application.getHttpServer()).post(route).send({
        appId,
        applicant: member.id,
        email,
        purpose: 'test',
      });
      const redisPassword = await cacheService.getClient().get(`tmpPass:${appId}:${email}`);

      expect(redisPassword).toBe(body.result.password);
    });
  });
});
