import 'reflect-metadata';
import { Logger, MiddlewareConsumer, Module, RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { decode } from 'jsonwebtoken';
import request from 'supertest';

import { ApiExceptionFilter } from '~/api.filter';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import DeviceService from './device/device.service';
import MailVerificationCodeService from '~/mailVerificationCode/mailVerificationCode.service';
import { LoginDeviceStatus } from './device/device.type';

// No DB, Redis or native modules: the real controller and AuthService run against in-memory fakes.
jest.mock('bcrypt', () => ({ compareSync: (password: string, hash: string) => hash === `hash:${password}` }));
jest.mock('~/member/member.infra', () => ({ MemberInfrastructure: class MemberInfrastructure {} }));
jest.mock('~/member/member.service', () => ({ MemberService: class MemberService {} }));
jest.mock('~/app/app.service', () => ({ AppService: class AppService {} }));
jest.mock('~/mailer/email/email.service', () => ({ EmailService: class EmailService {} }));
jest.mock('~/utility/utility.service', () => ({ UtilityService: class UtilityService {} }));
jest.mock('~/utility/cache/cache.service', () => ({ CacheService: class CacheService {} }));
jest.mock('./auth.infra', () => ({ AuthInfrastructure: class AuthInfrastructure {} }));
jest.mock('./device/device.service', () => ({ __esModule: true, default: class DeviceService {} }));
jest.mock('~/mailVerificationCode/mailVerificationCode.service', () => ({
  __esModule: true,
  default: class MailVerificationCodeService {},
}));
jest.mock('./permission.guard', () => ({ PermissionGuard: class PermissionGuard {} }));

const JWT_SECRET = 'synthetic-jwt-secret';

const apps: Record<string, any> = {
  'first.example.test': {
    id: 'first-app',
    orgId: 'first-org',
    host: 'first.example.test',
    name: 'first',
    settings: {},
    secrets: {},
    modules: [],
    defaultPermissions: ['FIRST_APP_DEFAULT'],
  },
  'second.example.test': {
    id: 'second-app',
    orgId: 'second-org',
    host: 'second.example.test',
    name: 'second',
    settings: {},
    secrets: {},
    modules: [],
    defaultPermissions: [],
  },
};

const members: Record<string, any> = {
  'first-app': {
    id: 'first-member',
    appId: 'first-app',
    role: 'general-member',
    email: 'first@example.test',
    username: 'first',
    name: 'first',
    passhash: 'hash:sample-password',
    isBusiness: false,
  },
  'second-app': {
    id: 'second-member',
    appId: 'second-app',
    role: 'general-member',
    email: 'second@example.test',
    username: 'second',
    name: 'second',
    passhash: 'hash:sample-password',
    isBusiness: false,
  },
};

const memberPermissions: Record<string, string[]> = {
  'first-member': ['FIRST_MEMBER_OWN'],
  'second-member': ['SECOND_MEMBER_OWN'],
};

const memberInfra = {
  getGeneralLoginMemberByUsernameOrEmail: jest.fn(async (appId: string) => members[appId] ?? null),
  getLoginMemberMetadata: jest.fn(async (memberId: string) => [
    { phones: [], oauths: {}, permissions: memberPermissions[memberId].map(permissionId => ({ permissionId })) },
  ]),
  getMemberPropertiesByIds: jest.fn(async () => []),
};
const redis = { get: jest.fn(async () => null), set: jest.fn(async () => 'OK') };
const deviceService = {
  getFingerPrintFromUa: jest.fn(() => 'fp-sample'),
  checkAndBindDevices: jest.fn(async () => LoginDeviceStatus.UNSUPPORTED),
};
const mailVerificationCodeService = { expireOldAndSendVerificationCode: jest.fn() };
const entityManager = { getRepository: () => ({ find: async () => [] }) };

const authService = new AuthService(
  new Logger(),
  new ConfigService({ NODE_ENV: 'test', HASURA_JWT_SECRET: JWT_SECRET }),
  {} as any,
  deviceService as any,
  {} as any,
  { getClient: () => redis } as any,
  {} as any,
  {} as any,
  {} as any,
  memberInfra as any,
  entityManager as any,
);

let sessionStore: Record<string, any> = {};
const hostResolver = (req: any, res: any, next: () => void) => {
  res.locals.appCache = apps[String(req.headers.host)];
  next();
};
const sessionProvider = (req: any, _res: any, next: () => void) => {
  req.session = sessionStore;
  req.cookies = {};
  next();
};

@Module({
  controllers: [AuthController],
  providers: [
    { provide: AuthService, useValue: authService },
    { provide: DeviceService, useValue: deviceService },
    { provide: MailVerificationCodeService, useValue: mailVerificationCodeService },
    { provide: Logger, useValue: new Logger() },
  ],
})
class TestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(sessionProvider, hostResolver).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

describe('general-login request host binding', () => {
  let app: NestExpressApplication;
  let generalLoginSpy: jest.SpyInstance;

  const login = (version: string, host: string, appId: string) =>
    request(app.getHttpServer())
      .post(`/api/v${version}/auth/general-login`)
      .set('Host', host)
      .send({
        appId,
        account: 'sample-account',
        password: 'sample-password',
        fingerPrintId: 'fp-body',
        geoLocation: { ip: null, country: null, countryCode: null },
      });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [TestModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    app
      .useGlobalPipes(new ValidationPipe())
      .useGlobalFilters(new ApiExceptionFilter())
      .setGlobalPrefix('api')
      .enableVersioning({ type: VersioningType.URI });
    await app.init();
    generalLoginSpy = jest.spyOn(authService, 'generalLogin');
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStore = {};
  });

  it.each(['1', '2'])('v%s: rejects an appId that differs from the request host app', async version => {
    const response = await login(version, 'first.example.test', 'second-app');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ code: 'E_APP_MISMATCH', message: 'app mismatch', result: null });
    expect(generalLoginSpy).not.toHaveBeenCalled();
    expect(memberInfra.getGeneralLoginMemberByUsernameOrEmail).not.toHaveBeenCalled();
    expect(deviceService.checkAndBindDevices).not.toHaveBeenCalled();
    expect(deviceService.getFingerPrintFromUa).not.toHaveBeenCalled();
    expect(redis.get).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
    expect(sessionStore).toEqual({});
  });

  it('keeps an existing session untouched when the appId differs', async () => {
    const existing = { 'second-app': { currentMemberId: 'someone', members: [] } };
    sessionStore = JSON.parse(JSON.stringify(existing));

    const response = await login('1', 'first.example.test', 'second-app');

    expect(response.status).toBe(403);
    expect(sessionStore).toEqual(existing);
  });

  it('logs in a member of the request host app as before', async () => {
    const response = await login('1', 'first.example.test', 'first-app');

    expect(response.status).toBe(201);
    expect(response.body.code).toBe('SUCCESS');
    expect(generalLoginSpy).toHaveBeenCalledTimes(1);
    expect(generalLoginSpy.mock.calls[0][0]).toBe(apps['first.example.test']);
    expect(generalLoginSpy.mock.calls[0][1]).toMatchObject({ appId: 'first-app', account: 'sample-account' });
    expect(deviceService.checkAndBindDevices).toHaveBeenCalledTimes(1);
    expect(sessionStore['first-app'].currentMemberId).toBe('first-member');

    const claims: any = decode(response.body.result.authToken);
    expect(claims.appId).toBe('first-app');
    expect(claims.orgId).toBe('first-org');
    expect(claims.permissions.sort()).toEqual(['FIRST_APP_DEFAULT', 'FIRST_MEMBER_OWN']);
    expect(claims['https://hasura.io/jwt/claims']).toMatchObject({
      'x-hasura-app-id': 'first-app',
      'x-hasura-org-id': 'first-org',
      'x-hasura-user-id': 'first-member',
    });
  });

  it('issues tokens whose permissions and org come only from the member own app', async () => {
    const response = await login('2', 'second.example.test', 'second-app');

    expect(response.status).toBe(201);
    const claims: any = decode(response.body.result.authToken);
    expect(claims.appId).toBe('second-app');
    expect(claims.orgId).toBe('second-org');
    expect(claims.permissions).toEqual(['SECOND_MEMBER_OWN']);
    expect(claims.permissions).not.toContain('FIRST_APP_DEFAULT');
    expect(claims['https://hasura.io/jwt/claims']).toMatchObject({
      'x-hasura-app-id': 'second-app',
      'x-hasura-org-id': 'second-org',
    });
  });
});
