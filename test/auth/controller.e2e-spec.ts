import request from 'supertest';
import { v4 } from 'uuid';
import bcrypt from 'bcrypt';
import { EntityManager, Repository } from 'typeorm';
import { json, urlencoded } from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { clone } from 'lodash';
import { ConfigService } from '@nestjs/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';

import { ApplicationModule } from '~/application.module';
import { AppPlan } from '~/entity/AppPlan';
import { AppExtendedModule } from '~/entity/AppExtendedModule';
import { JwtDTO } from '~/auth/auth.dto';
import { LoginDeviceStatus } from '~/auth/device/device.type';
import { AuthAuditLog } from '~/auth/entity/auth_audit_log.entity';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { App } from '~/app/entity/app.entity';
import { AppHost } from '~/app/entity/app_host.entity';
import { MemberDevice } from '~/member/entity/member_device.entity';
import { ApiExceptionFilter } from '~/api.filter';
import { CacheService } from '~/utility/cache/cache.service';
import { Member } from '~/member/entity/member.entity';

import { app, appHost, appPlan, member } from '../data';

describe('AuthController (e2e)', () => {
  let application: INestApplication;
  let cacheService: CacheService;
  let configService: ConfigService;
  let manager: EntityManager;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appExtendedModuleRepo: Repository<AppExtendedModule>;
  let appSettingRepo: Repository<AppSetting>;
  let appHostRepo: Repository<AppHost>;
  let memberRepo: Repository<Member>;
  let memberDeviceRepo: Repository<MemberDevice>;
  let authAuditLogRepo: Repository<AuthAuditLog>;

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
    appExtendedModuleRepo = manager.getRepository(AppExtendedModule);
    appSettingRepo = manager.getRepository(AppSetting);
    appHostRepo = manager.getRepository(AppHost);
    memberRepo = manager.getRepository(Member);
    memberDeviceRepo = manager.getRepository(MemberDevice);
    authAuditLogRepo = manager.getRepository(AuthAuditLog);

    await authAuditLogRepo.delete({});
    await memberDeviceRepo.delete({});
    await memberRepo.delete({});
    await appSettingRepo.delete({});
    await appExtendedModuleRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    
    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await appHostRepo.save(appHost);
    await memberRepo.save(member);
    
    await application.init();
  });

  afterEach(async () => {
    await authAuditLogRepo.delete({});
    await memberDeviceRepo.delete({});
    await memberRepo.delete({});
    await appSettingRepo.delete({});
    await appExtendedModuleRepo.delete({});
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

    describe('With login restriction or device management', () => {
      describe('With device management', () => {
        const deviceModuleApp = clone(app);
        deviceModuleApp.id = 'test-device-module';
        deviceModuleApp.symbol = 'TDM';

        const deviceModuleAppHost = clone(appHost);
        deviceModuleAppHost.appId = deviceModuleApp.id;
        deviceModuleAppHost.host = 'tdm.example.com';

        const appBindDeviceNumSetting = new AppSetting();
        appBindDeviceNumSetting.appId = deviceModuleApp.id;
        appBindDeviceNumSetting.key = 'bind_device_num';
        appBindDeviceNumSetting.value = '0';

        const appDeviceModule = new AppExtendedModule();
        appDeviceModule.appId = deviceModuleApp.id;
        appDeviceModule.moduleId = 'device_management';

        it('Should raise E_BIND_DEVICE error due to device limit exceed which more than restrict amount of devices exists', async () => {
          await manager.save(deviceModuleApp);
          await manager.save(deviceModuleAppHost);
          await manager.save(appDeviceModule);
          await manager.save(appBindDeviceNumSetting);

          const testMember = new Member();
          testMember.appId = deviceModuleApp.id;
          testMember.id = v4();
          testMember.role = 'general-member';
          testMember.email = 'tdm-test-member@example.com';
          testMember.username = 'tdm-test-member';
          testMember.passhash = bcrypt.hashSync('test_password', 1);
          await manager.save(testMember);

          const testMemberDevice = new MemberDevice();
          testMemberDevice.memberId = testMember.id;
          testMemberDevice.isLogin = true;
          testMemberDevice.fingerprintId = 'fingerprint-tdm-1';
          await manager.save(testMemberDevice);

          const { body } = await request(application.getHttpServer())
            .post(route)
            .set('Cookie', ['fingerPrintId=tdm-another-fingerprint'])
            .set('host', deviceModuleAppHost.host)
            .send({
              appId: deviceModuleApp.id,
              account: testMember.username,
              password: 'test_password',
            })
            .expect(201);

          expect(body).toStrictEqual({
            code: 'E_BIND_DEVICE',
            message: 'The number of device bind for this member reach limit.',
          });
        });

        it('Should let app-owner exception to skip device_management check and login', async () => {
          await manager.save(deviceModuleApp);
          await manager.save(deviceModuleAppHost);
          await manager.save(appDeviceModule);
          await manager.save(appBindDeviceNumSetting);

          const adminMember = new Member();
          adminMember.appId = deviceModuleApp.id;
          adminMember.id = v4();
          adminMember.role = 'app-owner';
          adminMember.email = 'tdm-admin-member@example.com';
          adminMember.username = 'tdm-admin-member';
          adminMember.passhash = bcrypt.hashSync('test_password', 1);
          await manager.save(adminMember);
  
          const fingerPrint = 'tdm-admin-fingerprint';
          const { body } = await request(application.getHttpServer())
            .post(route)
            .set('host', deviceModuleAppHost.host)
            .set('Cookie', [`fingerPrintId=${fingerPrint}`])
            .send({
              appId: deviceModuleApp.id,
              account: adminMember.username,
              password: 'test_password',
            })
            .expect(201);
          const { code, message, result } = body;
          const {authToken, deviceStatus } = result;
          expect(code).toBe('SUCCESS');
          expect(message).toBe('login successfully');
          expect(authToken).not.toBeUndefined();
          expect(deviceStatus).toBe(LoginDeviceStatus.AVAILABLE);

          const jwtSecret = configService.getOrThrow('HASURA_JWT_SECRET');
          const deserializedToken: JwtDTO = jwt.verify(authToken, jwtSecret) as JwtDTO;
          expect(deserializedToken.sub).toBe(adminMember.id);
          expect(deserializedToken.appId).toBe(deviceModuleApp.id);
          expect(deserializedToken.memberId).toBe(adminMember.id);
          expect(deserializedToken.username).toBe(adminMember.username);
          expect(deserializedToken.email).toBe(adminMember.email);
          expect(deserializedToken.loggedInMembers.length).toBeGreaterThan(0);

          const [firstMember] = deserializedToken.loggedInMembers;
          expect(firstMember.appId).toBe(deviceModuleApp.id);
          expect(firstMember.id).toBe(adminMember.id);
          expect(firstMember.email).toBe(adminMember.email);
          expect(firstMember.username).toBe(adminMember.username);

          const memberDevices = await memberDeviceRepo.findBy({ memberId: adminMember.id });
          expect(memberDevices.length).toBe(1);
          const [memberDevice] = memberDevices;
          expect(memberDevice.fingerprintId).toBe(fingerPrint);
          expect(memberDevice.isLogin).toBeTruthy();
        });

        it('Should let general-member login', async () => {
          await manager.save(deviceModuleApp);
          await manager.save(deviceModuleAppHost);
          await manager.save(appDeviceModule);
          await manager.save(appBindDeviceNumSetting);

          const generalMember = new Member();
          generalMember.appId = deviceModuleApp.id;
          generalMember.id = v4();
          generalMember.role = 'general-member';
          generalMember.email = 'tdm-general-member@example.com';
          generalMember.username = 'tdm-general-member';
          generalMember.passhash = bcrypt.hashSync('test_password', 1);
          await manager.save(generalMember);
  
          const fingerPrint = 'tdm-general-fingerprint';
          const { body } = await request(application.getHttpServer())
            .post(route)
            .set('host', deviceModuleAppHost.host)
            .set('Cookie', [`fingerPrintId=${fingerPrint}`])
            .send({
              appId: deviceModuleApp.id,
              account: generalMember.username,
              password: 'test_password',
            })
            .expect(201);
          const { code, message, result } = body;
          const {authToken, deviceStatus } = result;
          expect(code).toBe('SUCCESS');
          expect(message).toBe('login successfully');
          expect(authToken).not.toBeUndefined();
          expect(deviceStatus).toBe(LoginDeviceStatus.AVAILABLE);

          const jwtSecret = configService.getOrThrow('HASURA_JWT_SECRET');
          const deserializedToken: JwtDTO = jwt.verify(authToken, jwtSecret) as JwtDTO;
          expect(deserializedToken.sub).toBe(generalMember.id);
          expect(deserializedToken.appId).toBe(deviceModuleApp.id);
          expect(deserializedToken.memberId).toBe(generalMember.id);
          expect(deserializedToken.username).toBe(generalMember.username);
          expect(deserializedToken.email).toBe(generalMember.email);
          expect(deserializedToken.loggedInMembers.length).toBeGreaterThan(0);

          const [firstMember] = deserializedToken.loggedInMembers;
          expect(firstMember.appId).toBe(deviceModuleApp.id);
          expect(firstMember.id).toBe(generalMember.id);
          expect(firstMember.email).toBe(generalMember.email);
          expect(firstMember.username).toBe(generalMember.username);

          const memberDevices = await memberDeviceRepo.findBy({ memberId: generalMember.id });
          expect(memberDevices.length).toBe(1);
          const [memberDevice] = memberDevices;
          expect(memberDevice.fingerprintId).toBe(fingerPrint);
          expect(memberDevice.isLogin).toBeTruthy();
        });

        it('Should let logined in general-member login again', async () => {
          await manager.save(deviceModuleApp);
          await manager.save(deviceModuleAppHost);
          await manager.save(appDeviceModule);
          await manager.save(appBindDeviceNumSetting);

          const loginedGeneralMember = new Member();
          loginedGeneralMember.appId = deviceModuleApp.id;
          loginedGeneralMember.id = v4();
          loginedGeneralMember.role = 'general-member';
          loginedGeneralMember.email = 'tdm-general-member@example.com';
          loginedGeneralMember.username = 'tdm-general-member';
          loginedGeneralMember.passhash = bcrypt.hashSync('test_password', 1);
          await manager.save(loginedGeneralMember);
  
          const loginedGeneralMemberDevice = new MemberDevice();
          loginedGeneralMemberDevice.memberId = loginedGeneralMember.id;
          loginedGeneralMemberDevice.fingerprintId = 'fingerprint-tdm-logined';
          loginedGeneralMemberDevice.isLogin = true;
          await manager.save(loginedGeneralMemberDevice);

          const { body } = await request(application.getHttpServer())
            .post(route)
            .set('host', deviceModuleAppHost.host)
            .set('Cookie', [`fingerPrintId=${loginedGeneralMemberDevice.fingerprintId}`])
            .send({
              appId: deviceModuleApp.id,
              account: loginedGeneralMember.username,
              password: 'test_password',
            })
            .expect(201);
          const { code, message, result } = body;
          const {authToken, deviceStatus } = result;
          expect(code).toBe('SUCCESS');
          expect(message).toBe('login successfully');
          expect(authToken).not.toBeUndefined();
          expect(deviceStatus).toBe(LoginDeviceStatus.EXISTED);

          const jwtSecret = configService.getOrThrow('HASURA_JWT_SECRET');
          const deserializedToken: JwtDTO = jwt.verify(authToken, jwtSecret) as JwtDTO;
          expect(deserializedToken.sub).toBe(loginedGeneralMember.id);
          expect(deserializedToken.appId).toBe(deviceModuleApp.id);
          expect(deserializedToken.memberId).toBe(loginedGeneralMember.id);
          expect(deserializedToken.username).toBe(loginedGeneralMember.username);
          expect(deserializedToken.email).toBe(loginedGeneralMember.email);
          expect(deserializedToken.loggedInMembers.length).toBeGreaterThan(0);

          const [firstMember] = deserializedToken.loggedInMembers;
          expect(firstMember.appId).toBe(deviceModuleApp.id);
          expect(firstMember.id).toBe(loginedGeneralMember.id);
          expect(firstMember.email).toBe(loginedGeneralMember.email);
          expect(firstMember.username).toBe(loginedGeneralMember.username);

          const memberDevices = await memberDeviceRepo.findBy({ memberId: loginedGeneralMember.id });
          expect(memberDevices.length).toBe(1);
          const [memberDevice] = memberDevices;
          expect(memberDevice.fingerprintId).toBe(loginedGeneralMemberDevice.fingerprintId);
          expect(memberDevice.isLogin).toBeTruthy();
        });
      });

      describe('With login restriction', () => {
        const loginModuleApp = clone(app);
        loginModuleApp.id = 'test-login-module';
        loginModuleApp.symbol = 'TLM';

        const loginModuleAppHost = clone(appHost);
        loginModuleAppHost.appId = loginModuleApp.id;
        loginModuleAppHost.host = 'tlm.example.com';

        const appLoginDeviceNumSetting = new AppSetting();
        appLoginDeviceNumSetting.appId = loginModuleApp.id;
        appLoginDeviceNumSetting.key = 'login_device_num';
        appLoginDeviceNumSetting.value = '1';

        const appLoginModule = new AppExtendedModule();
        appLoginModule.appId = loginModuleApp.id;
        appLoginModule.moduleId = 'login_restriction';

        it('Should raise error due to login limit exceed which more than restrict amount of logined devices exists', async () => {
          await manager.save(loginModuleApp);
          await manager.save(loginModuleAppHost);
          await manager.save(appLoginModule);
          await manager.save(appLoginDeviceNumSetting);

          const testMember = new Member();
          testMember.appId = loginModuleApp.id;
          testMember.id = v4();
          testMember.role = 'general-member';
          testMember.email = 'tlm-test-member@example.com';
          testMember.username = 'tlm-test-member';
          testMember.passhash = bcrypt.hashSync('test_password', 1);
          await manager.save(testMember);

          const testMemberDevice = new MemberDevice();
          testMemberDevice.memberId = testMember.id;
          testMemberDevice.isLogin = true;
          testMemberDevice.fingerprintId = 'fingerprint-tlm-1';
          await manager.save(testMemberDevice);

          const { body } = await request(application.getHttpServer())
            .post(route)
            .set('Cookie', ['fingerPrintId=tlm-another-fingerprint'])
            .set('host', loginModuleAppHost.host)
            .send({
              appId: loginModuleApp.id,
              account: testMember.username,
              password: 'test_password',
            })
            .expect(201);

          expect(body).toStrictEqual({
            code: 'E_LOGIN_DEVICE',
            message: 'The number of device login for this member reach limit.',
          });
        });

        it('Should let app-owner exception to skip login_restriction check and login', async () => {
          await manager.save(loginModuleApp);
          await manager.save(loginModuleAppHost);
          await manager.save(appLoginModule);
          await manager.save(appLoginDeviceNumSetting);

          const adminMember = new Member();
          adminMember.appId = loginModuleApp.id;
          adminMember.id = v4();
          adminMember.role = 'app-owner';
          adminMember.email = 'tlm-admin-member@example.com';
          adminMember.username = 'tlm-admin-member';
          adminMember.passhash = bcrypt.hashSync('test_password', 1);
          await manager.save(adminMember);
  
          const fingerPrint = 'tlm-admin-fingerprint';
          const { body } = await request(application.getHttpServer())
            .post(route)
            .set('host', loginModuleAppHost.host)
            .set('Cookie', [`fingerPrintId=${fingerPrint}`])
            .send({
              appId: loginModuleApp.id,
              account: adminMember.username,
              password: 'test_password',
            })
            .expect(201);
          const { code, message, result } = body;
          const {authToken, deviceStatus } = result;
          expect(code).toBe('SUCCESS');
          expect(message).toBe('login successfully');
          expect(authToken).not.toBeUndefined();
          expect(deviceStatus).toBe(LoginDeviceStatus.AVAILABLE);

          const jwtSecret = configService.getOrThrow('HASURA_JWT_SECRET');
          const deserializedToken: JwtDTO = jwt.verify(authToken, jwtSecret) as JwtDTO;
          expect(deserializedToken.sub).toBe(adminMember.id);
          expect(deserializedToken.appId).toBe(loginModuleApp.id);
          expect(deserializedToken.memberId).toBe(adminMember.id);
          expect(deserializedToken.username).toBe(adminMember.username);
          expect(deserializedToken.email).toBe(adminMember.email);
          expect(deserializedToken.loggedInMembers.length).toBeGreaterThan(0);

          const [firstMember] = deserializedToken.loggedInMembers;
          expect(firstMember.appId).toBe(loginModuleApp.id);
          expect(firstMember.id).toBe(adminMember.id);
          expect(firstMember.email).toBe(adminMember.email);
          expect(firstMember.username).toBe(adminMember.username);

          const memberDevices = await memberDeviceRepo.findBy({ memberId: adminMember.id });
          expect(memberDevices.length).toBe(1);
          const [memberDevice] = memberDevices;
          expect(memberDevice.fingerprintId).toBe(fingerPrint);
          expect(memberDevice.isLogin).toBeTruthy();
        });

        it('Should let general-member login', async () => {
          await manager.save(loginModuleApp);
          await manager.save(loginModuleAppHost);
          await manager.save(appLoginModule);
          await manager.save(appLoginDeviceNumSetting);

          const generalMember = new Member();
          generalMember.appId = loginModuleApp.id;
          generalMember.id = v4();
          generalMember.role = 'general-member';
          generalMember.email = 'tlm-general-member@example.com';
          generalMember.username = 'tlm-general-member';
          generalMember.passhash = bcrypt.hashSync('test_password', 1);
          await manager.save(generalMember);

          const fingerPrint = 'tlm-general-fingerprint';
          const { body } = await request(application.getHttpServer())
            .post(route)
            .set('host', loginModuleAppHost.host)
            .set('Cookie', [`fingerPrintId=${fingerPrint}`])
            .send({
              appId: loginModuleApp.id,
              account: generalMember.username,
              password: 'test_password',
            })
            .expect(201);
          const { code, message, result } = body;
          const {authToken, deviceStatus } = result;
          expect(code).toBe('SUCCESS');
          expect(message).toBe('login successfully');
          expect(authToken).not.toBeUndefined();
          expect(deviceStatus).toBe(LoginDeviceStatus.AVAILABLE);

          const jwtSecret = configService.getOrThrow('HASURA_JWT_SECRET');
          const deserializedToken: JwtDTO = jwt.verify(authToken, jwtSecret) as JwtDTO;
          expect(deserializedToken.sub).toBe(generalMember.id);
          expect(deserializedToken.appId).toBe(loginModuleApp.id);
          expect(deserializedToken.memberId).toBe(generalMember.id);
          expect(deserializedToken.username).toBe(generalMember.username);
          expect(deserializedToken.email).toBe(generalMember.email);
          expect(deserializedToken.loggedInMembers.length).toBeGreaterThan(0);

          const [firstMember] = deserializedToken.loggedInMembers;
          expect(firstMember.appId).toBe(loginModuleApp.id);
          expect(firstMember.id).toBe(generalMember.id);
          expect(firstMember.email).toBe(generalMember.email);
          expect(firstMember.username).toBe(generalMember.username);

          const memberDevices = await memberDeviceRepo.findBy({ memberId: generalMember.id });
          expect(memberDevices.length).toBe(1);
          const [memberDevice] = memberDevices;
          expect(memberDevice.fingerprintId).toBe(fingerPrint);
          expect(memberDevice.isLogin).toBeTruthy();
        });

        it('Should let logined in general-member login again', async () => {
          await manager.save(loginModuleApp);
          await manager.save(loginModuleAppHost);
          await manager.save(appLoginModule);
          await manager.save(appLoginDeviceNumSetting);

          const loginedGeneralMember = new Member();
          loginedGeneralMember.appId = loginModuleApp.id;
          loginedGeneralMember.id = v4();
          loginedGeneralMember.role = 'general-member';
          loginedGeneralMember.email = 'tlm-general-member@example.com';
          loginedGeneralMember.username = 'tlm-general-member';
          loginedGeneralMember.passhash = bcrypt.hashSync('test_password', 1);
          await manager.save(loginedGeneralMember);
  
          const loginedGeneralMemberDevice = new MemberDevice();
          loginedGeneralMemberDevice.memberId = loginedGeneralMember.id;
          loginedGeneralMemberDevice.fingerprintId = 'fingerprint-tlm-logined';
          loginedGeneralMemberDevice.isLogin = true;
          await manager.save(loginedGeneralMemberDevice);

          const { body } = await request(application.getHttpServer())
            .post(route)
            .set('host', loginModuleAppHost.host)
            .set('Cookie', [`fingerPrintId=${loginedGeneralMemberDevice.fingerprintId}`])
            .send({
              appId: loginModuleApp.id,
              account: loginedGeneralMember.username,
              password: 'test_password',
            })
            .expect(201);
          const { code, message, result } = body;
          const {authToken, deviceStatus } = result;
          expect(code).toBe('SUCCESS');
          expect(message).toBe('login successfully');
          expect(authToken).not.toBeUndefined();
          expect(deviceStatus).toBe(LoginDeviceStatus.EXISTED);

          const jwtSecret = configService.getOrThrow('HASURA_JWT_SECRET');
          const deserializedToken: JwtDTO = jwt.verify(authToken, jwtSecret) as JwtDTO;
          expect(deserializedToken.sub).toBe(loginedGeneralMember.id);
          expect(deserializedToken.appId).toBe(loginModuleApp.id);
          expect(deserializedToken.memberId).toBe(loginedGeneralMember.id);
          expect(deserializedToken.username).toBe(loginedGeneralMember.username);
          expect(deserializedToken.email).toBe(loginedGeneralMember.email);
          expect(deserializedToken.loggedInMembers.length).toBeGreaterThan(0);

          const [firstMember] = deserializedToken.loggedInMembers;
          expect(firstMember.appId).toBe(loginModuleApp.id);
          expect(firstMember.id).toBe(loginedGeneralMember.id);
          expect(firstMember.email).toBe(loginedGeneralMember.email);
          expect(firstMember.username).toBe(loginedGeneralMember.username);

          const memberDevices = await memberDeviceRepo.findBy({ memberId: loginedGeneralMember.id });
          expect(memberDevices.length).toBe(1);
          const [memberDevice] = memberDevices;
          expect(memberDevice.fingerprintId).toBe(loginedGeneralMemberDevice.fingerprintId);
          expect(memberDevice.isLogin).toBeTruthy();
        });
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

      it('should successfully login with a temporary password', async () => {
        const testTempLoginMember = new Member();
        testTempLoginMember.appId = app.id;
        testTempLoginMember.id = v4();
        testTempLoginMember.role = 'general-member';
        testTempLoginMember.email = 'test-temp-login-member@example.com';
        testTempLoginMember.username = 'test-temp-login-member';
        await manager.save(testTempLoginMember);

        const tempPassword = 'login-temp-password';
        await cacheService.getClient().set(`tmpPass:${testTempLoginMember.appId}:${testTempLoginMember.email}`, tempPassword);

        const { body } = await request(application.getHttpServer())
          .post(route)
          .set('host', appHost.host)
          .send({
            appId: testTempLoginMember.appId,
            account: testTempLoginMember.email,
            password: tempPassword,
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
        expect(deserializedToken.sub).toBe(testTempLoginMember.id);
        expect(deserializedToken.appId).toBe(app.id);
        expect(deserializedToken.memberId).toBe(testTempLoginMember.id);
        expect(deserializedToken.username).toBe(testTempLoginMember.username);
        expect(deserializedToken.email).toBe(testTempLoginMember.email);
        expect(deserializedToken.loggedInMembers.length).toBeGreaterThan(0);

        const [firstMember] = deserializedToken.loggedInMembers;
        expect(firstMember.appId).toBe(app.id);
        expect(firstMember.id).toBe(testTempLoginMember.id);
        expect(firstMember.email).toBe(testTempLoginMember.email);
        expect(firstMember.username).toBe(testTempLoginMember.username);
      });
    });
  });

  describe('/auth/refresh-token (POST)', () => {
    const route = '/auth/refresh-token';

    it('Should raise error due to incorrect payload', async () => {
      await request(application.getHttpServer())
        .post(route)
        .set('host', appHost.host)
        .send({})
        .expect(400);
    });

    it('Should raise E_NO_MEMBER error due to empty session', async () => {
      const { body } = await request(application.getHttpServer())
        .post(route)
        .set('host', appHost.host)
        .send({
          appId: app.id,
          fingerPrintId: 'not-exists-fingerprint',
        })
        .expect(201);
      expect(body.code).toBe('E_NO_MEMBER');
      expect(body.message).toBe('no such member');
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

  describe('/auth/password/temporary (POST)', () => {
    const route = '/auth/password/temporary';

    it('should successfully retrieve a temporary password', async () => {
      const appId = member.appId;
      const email = member.email;
      const applicant = member.id;

      const { body } = await request(application.getHttpServer())
        .post(route)
        .set('host', appHost.host)
        .send({
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
      const { body } = await request(application.getHttpServer())
        .post(route)
        .set('host', appHost.host)
        .send({
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

    it('should successfully login with a temporary password', async () => {
      const appId = member.appId;
      const email = member.email;
      const applicant = member.id;

      const { body } = await request(application.getHttpServer())
        .post(route)
        .set('host', appHost.host)
        .send({
          appId,
          applicant,
          email,
          purpose: 'test',
        });
      const { code, result } = body;
      const { password } = result;

      expect(code).toBe('SUCCESS');
      expect(password).toBeDefined();

      const authAuditLog = await manager.getRepository(AuthAuditLog).findOne({ where: { memberId: applicant } });
      expect(authAuditLog.action).toBe('apply_temporary_password');

      const redisPassword = await cacheService.getClient().get(`tmpPass:${appId}:${email}`);
      expect(redisPassword).toBe(password);

      const { body: loginBody } = await request(application.getHttpServer())
        .post('/auth/general-login')
        .set('host', appHost.host)
        .send({
          appId,
          account: email,
          password: password,
        })
        .expect(201);
      expect(loginBody.code).toBe('SUCCESS');
      expect(loginBody.message).toBe('login successfully');
    });
  });
});