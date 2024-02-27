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
import { v4 } from 'uuid';
import bcrypt from 'bcrypt';
import { MemberPermissionExtra } from '~/entity/MemberPermissionExtra';
import { Permission } from '~/permission/entity/permission.entity';
import { ProgramRole } from '~/entity/ProgramRole';

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
  let permissionRepo: Repository<Permission>;
  let memberPermissionExtraRepo: Repository<MemberPermissionExtra>;
  let programRoleRepo: Repository<ProgramRole>;

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
    permissionRepo = manager.getRepository(Permission);
    memberPermissionExtraRepo = manager.getRepository(MemberPermissionExtra);
    programRoleRepo = manager.getRepository(ProgramRole);

    await orderProductRepo.delete({});
    await orderLogRepo.delete({});
    await productRepo.delete({});
    await programPlanRepo.delete({});
    await currencyRepo.delete({});
    await programContentProgressRepo.delete({});
    await programContentRepo.delete({});
    await programContentSectionRepo.delete({});
    await programContentBodyRepo.delete({});
    await programRoleRepo.delete({});
    await programRepo.delete({});
    await memberPermissionExtraRepo.delete({});
    await permissionRepo.delete({});
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
    await programRoleRepo.delete({});
    await programRepo.delete({});
    await memberPermissionExtraRepo.delete({});
    await permissionRepo.delete({});
    await memberRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await application.close();
  });

  const apiPath = {
    auth: {
      generalLogin: '/auth/general-login',
    },
    program: {
      programs: '/programs',
    },
    content: {
      contents: '/contents',
    },
  };

  describe('/programs (GET)', () => {
    const route = `/programs`;
    const password = 'test_password';

    it('Should raise error due to unauthorized', async () => {
      const header = { host: appHost.host };

      request(application.getHttpServer())
        .get(`${route}`)
        .set(header)
        .expect({ statusCode: 401, message: 'Unauthorized' });
    });

    it('Should successfully get owned programs by member', async () => {
      const { body } = await request(application.getHttpServer())
        .post(apiPath.auth.generalLogin)
        .set('host', appHost.host)
        .send({
          appId: member.appId,
          account: member.email,
          password: password,
        })
        .expect(201);
      const { authToken } = body.result;

      const header = { authorization: `Bearer ${authToken}`, host: appHost.host };

      const result = await request(application.getHttpServer()).get(`${route}`).set(header);

      expect(200).toEqual(result.status);
    });
  });

  describe('/programs/:programId/contents/:programContentId (GET)', () => {
    const route = apiPath.program.programs + '/' + program.id + apiPath.content.contents + '/' + programContent.id;
    const password = 'test_password';

    const testGeneralMember = new Member();
    testGeneralMember.id = v4();
    testGeneralMember.appId = app.id;
    testGeneralMember.email = 'general-member@example.com';
    testGeneralMember.username = 'general-member';
    testGeneralMember.role = 'general-member';
    testGeneralMember.passhash = bcrypt.hashSync('test_password', 1);

    const programNormalPermission = new Permission();
    programNormalPermission.id = 'PROGRAM_NORMAL';
    programNormalPermission.group = 'program';

    const programAdminPermission = new Permission();
    programAdminPermission.id = 'PROGRAM_ADMIN';
    programAdminPermission.group = 'program';

    const testGeneralMemberProgramNormalPermission = new MemberPermissionExtra();
    testGeneralMemberProgramNormalPermission.id = v4();
    testGeneralMemberProgramNormalPermission.memberId = testGeneralMember.id;
    testGeneralMemberProgramNormalPermission.permissionId = programNormalPermission.id;

    const testGeneralMemberProgramAdminPermission = new MemberPermissionExtra();
    testGeneralMemberProgramAdminPermission.id = v4();
    testGeneralMemberProgramAdminPermission.memberId = testGeneralMember.id;
    testGeneralMemberProgramAdminPermission.permissionId = programAdminPermission.id;

    const testGeneralMemberProgramRoleOwner = new ProgramRole();
    testGeneralMemberProgramRoleOwner.id = v4();
    testGeneralMemberProgramRoleOwner.programId = program.id;
    testGeneralMemberProgramRoleOwner.memberId = testGeneralMember.id;
    testGeneralMemberProgramRoleOwner.name = 'owner';

    const testGeneralMemberProgramRoleInstructor = new ProgramRole();
    testGeneralMemberProgramRoleInstructor.id = v4();
    testGeneralMemberProgramRoleInstructor.programId = program.id;
    testGeneralMemberProgramRoleInstructor.memberId = testGeneralMember.id;
    testGeneralMemberProgramRoleInstructor.name = 'instructor';

    it('Should raise error due to unauthorized', async () => {
      const header = { host: appHost.host };

      request(application.getHttpServer())
        .get(`${route}`)
        .set(header)
        .expect({ statusCode: 401, message: 'Unauthorized' });
    });

    it(`Should return empty to member's role is general-member`, async () => {
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

      expect(result.body).toEqual({});
    });

    it(`Should return empty to member's permission is PROGRAM_NORMAL and member isn't program role`, async () => {
      await permissionRepo.save(programNormalPermission);
      await memberRepo.save(testGeneralMember);
      await memberPermissionExtraRepo.save(testGeneralMemberProgramNormalPermission);

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

      expect(result.body).toEqual({});
    });

    it(`Should return empty to member's permission isn't PROGRAM_ADMIN or PROGRAM_NORMAL and program role is instructor`, async () => {
      await memberRepo.save(testGeneralMember);
      await programRoleRepo.save(testGeneralMemberProgramRoleInstructor);

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
      expect(result.body).toEqual({});
    });

    it(`Should return empty to member's permission isn't PROGRAM_ADMIN or PROGRAM_NORMAL and program role is owner`, async () => {
      await memberRepo.save(testGeneralMember);
      await programRoleRepo.save(testGeneralMemberProgramRoleOwner);

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
      expect(result.body).toEqual({});
    });

    it(`Should return programContentId to member's role is app-owner`, async () => {
      await memberRepo.save(member);

      const { body } = await request(application.getHttpServer())
        .post(apiPath.auth.generalLogin)
        .set('host', appHost.host)
        .send({
          appId: member.appId,
          account: member.email,
          password: password,
        })
        .expect(201);

      const { authToken } = body.result;

      const header = { authorization: `Bearer ${authToken}`, host: appHost.host };

      const result = await request(application.getHttpServer()).get(`${route}`).set(header);

      expect(result.body).toEqual({ programContentId: programContent.id });
      expect(200).toEqual(result.status);
    });

    it(`Should return programContentId to member's permission is PROGRAM_ADMIN`, async () => {
      await permissionRepo.save(programAdminPermission);
      await memberRepo.save(testGeneralMember);
      await memberPermissionExtraRepo.save(testGeneralMemberProgramAdminPermission);

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

      expect(result.body).toEqual({ programContentId: programContent.id });
    });

    it(`Should return programContentId to member's permission is PROGRAM_NORMAL and program role is instructor`, async () => {
      await memberRepo.save(testGeneralMember);
      await programRoleRepo.save(testGeneralMemberProgramRoleInstructor);
      await permissionRepo.save(programNormalPermission);
      await memberPermissionExtraRepo.save(testGeneralMemberProgramNormalPermission);

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
      expect(result.body).toEqual({ programContentId: programContent.id });
    });

    it(`Should return programContentId to member's permission is PROGRAM_NORMAL and program role is owner`, async () => {
      await permissionRepo.save(programNormalPermission);
      await memberRepo.save(testGeneralMember);
      await programRoleRepo.save(testGeneralMemberProgramRoleOwner);
      await memberPermissionExtraRepo.save(testGeneralMemberProgramNormalPermission);

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
      expect(result.body).toEqual({ programContentId: programContent.id });
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
