import 'reflect-metadata';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Logger, MiddlewareConsumer, Module, RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import bcrypt from 'bcrypt';

import { ApiExceptionFilter } from '~/api.filter';
import { CacheService } from '~/utility/cache/cache.service';
import MailVerificationCodeService from '~/mailVerificationCode/mailVerificationCode.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import DeviceService from './device/device.service';
import { LoginDeviceStatus } from './device/device.type';
import { fingerprintHash, matchDeviceLoginChallenge, normalizeIdentifier } from './auth-limits';
import { FakeRedis } from './testing/fake-redis';

// No DB or native modules: the real controller and AuthService run against in-memory fakes.
jest.mock('bcrypt', () => ({
  compare: jest.fn(async (password: string, hash: string) => hash === `hash:${password}`),
}));
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

const fixture = JSON.parse(readFileSync(join(__dirname, 'auth-limits.fixture.json'), 'utf8'));

const APP_ID = 'first-app';
const ACCOUNT = 'Sample@Example.TEST';
const PASSWORD = 'sample-password';
const CLIENT_IP = '198.51.100.9';
const FINGERPRINT = 'fp-sample';
const appCache = {
  id: APP_ID,
  orgId: 'first-org',
  host: 'first.example.test',
  name: 'first',
  settings: {},
  secrets: {},
  modules: [],
  defaultPermissions: [],
};
const member = {
  id: 'first-member',
  appId: APP_ID,
  role: 'general-member',
  email: 'sample@example.test',
  username: 'sample',
  name: 'sample',
  passhash: `hash:${PASSWORD}`,
  isBusiness: false,
};

let redis: FakeRedis;
let currentMember: Record<string, any> | null;
const memberInfra = {
  getGeneralLoginMemberByUsernameOrEmail: jest.fn(async () => currentMember),
  getLoginMemberMetadata: jest.fn(async () => [{ phones: [], oauths: {}, permissions: [] }]),
  getMemberPropertiesByIds: jest.fn(async () => []),
};
const deviceService = {
  getFingerPrintFromUa: jest.fn(() => FINGERPRINT),
  checkAndBindDevices: jest.fn(async () => LoginDeviceStatus.UNSUPPORTED),
};
const mailVerificationCodeService = { sendDeviceBindCode: jest.fn(async () => true) };
const mailService = { insertEmailJobIntoQueue: jest.fn(async () => undefined) };
const entityManager = { getRepository: () => ({ find: async () => [] }) };
const cacheService = { getClient: () => redis };

const authService = new AuthService(
  new Logger(),
  new ConfigService({ NODE_ENV: 'test', HASURA_JWT_SECRET: 'synthetic-jwt-secret' }),
  {} as any,
  deviceService as any,
  mailService as any,
  cacheService as any,
  {} as any,
  {} as any,
  {} as any,
  memberInfra as any,
  entityManager as any,
);

@Module({
  controllers: [AuthController],
  providers: [
    { provide: AuthService, useValue: authService },
    { provide: DeviceService, useValue: deviceService },
    { provide: MailVerificationCodeService, useValue: mailVerificationCodeService },
    { provide: CacheService, useValue: cacheService },
    { provide: Logger, useValue: new Logger() },
  ],
})
class TestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: any, res: any, next: () => void) => {
        req.session = {};
        req.cookies = {};
        res.locals.appCache = appCache;
        next();
      })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/<([^>]+)>/g, (_match, name) => values[name]);
const keyValues = {
  'app|org': 'app',
  'appId|orgId': APP_ID,
  appId: APP_ID,
  'norm(account)': normalizeIdentifier(ACCOUNT),
  'norm(email)': normalizeIdentifier(member.email),
  ip: CLIENT_IP,
  memberId: member.id,
  fpHash: fingerprintHash(FINGERPRINT),
};
const accountIpKey = fill(fixture.keys.loginFailAccountIp.key, keyValues);
const accountKey = fill(fixture.keys.loginFailAccount.key, keyValues);
const ipKey = fill(fixture.keys.loginFailIp.key, keyValues);
const compare = bcrypt.compare as unknown as jest.Mock;

describe('general-login attempt limits and device challenges', () => {
  let app: NestExpressApplication;

  const login = (password = PASSWORD, account = ACCOUNT) =>
    request(app.getHttpServer())
      .post('/api/v2/auth/general-login')
      .set('Host', 'first.example.test')
      .set('X-Forwarded-For', CLIENT_IP)
      .send({
        appId: APP_ID,
        account,
        password,
        fingerPrintId: 'fp-body',
        geoLocation: { ip: null, country: null, countryCode: null },
      });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [TestModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    app.set('trust proxy', 1);
    app
      .useGlobalPipes(new ValidationPipe())
      .useGlobalFilters(new ApiExceptionFilter())
      .setGlobalPrefix('api')
      .enableVersioning({ type: VersioningType.URI });
    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    redis = new FakeRedis();
    currentMember = { ...member };
    deviceService.checkAndBindDevices.mockResolvedValue(LoginDeviceStatus.UNSUPPORTED);
  });

  describe('login attempts', () => {
    it('checks at most the cap of passwords in a burst of concurrent attempts', async () => {
      const responses = await Promise.all(Array.from({ length: 50 }, () => login('wrong-password')));

      expect(compare.mock.calls.length).toBeLessThanOrEqual(fixture.keys.loginFailAccountIp.cap);
      expect(memberInfra.getGeneralLoginMemberByUsernameOrEmail.mock.calls.length).toBeLessThanOrEqual(
        fixture.keys.loginFailAccountIp.cap,
      );
      const limited = responses.filter(r => r.status === fixture.tooManyAttemptsResponse.httpStatus);
      expect(limited).toHaveLength(50 - fixture.keys.loginFailAccountIp.cap);
      limited.forEach(r => expect(r.body).toEqual(fixture.tooManyAttemptsResponse.body));
      expect(responses.filter(r => r.body.code === 'E_PASSWORD')).toHaveLength(fixture.keys.loginFailAccountIp.cap);
    });

    it('rejects even the right password once the cap is reached, without checking it', async () => {
      for (let i = 0; i < fixture.keys.loginFailAccountIp.cap; i++) {
        expect((await login('wrong-password')).body.code).toBe('E_PASSWORD');
      }
      compare.mockClear();

      const response = await login();

      expect(response.status).toBe(fixture.tooManyAttemptsResponse.httpStatus);
      expect(response.body).toEqual(fixture.tooManyAttemptsResponse.body);
      expect(compare).not.toHaveBeenCalled();
    });

    it('counts unknown accounts too', async () => {
      currentMember = null;
      for (let i = 0; i < fixture.keys.loginFailAccountIp.cap; i++) {
        expect((await login('wrong-password')).body.code).toBe('E_NO_MEMBER');
      }
      memberInfra.getGeneralLoginMemberByUsernameOrEmail.mockClear();

      const response = await login('wrong-password');

      expect(response.status).toBe(fixture.tooManyAttemptsResponse.httpStatus);
      expect(memberInfra.getGeneralLoginMemberByUsernameOrEmail).not.toHaveBeenCalled();
    });

    it('counts per account and client ip with the fixture keys and clears them after a successful login', async () => {
      await login('wrong-password');
      await login('wrong-password');
      expect(redis.keys('auth:login-fail:')).toEqual([accountKey, accountIpKey, ipKey].sort());
      expect(await redis.get(accountIpKey)).toBe('2');
      expect(redis.ttl(accountIpKey)).toBe(fixture.keys.loginFailAccountIp.ttlSeconds);
      expect(redis.ttl(accountKey)).toBe(fixture.keys.loginFailAccount.ttlSeconds);
      expect(redis.ttl(ipKey)).toBe(fixture.keys.loginFailIp.ttlSeconds);

      const response = await login();

      expect(response.body.code).toBe('SUCCESS');
      expect(redis.keys('auth:login-fail:')).toEqual([ipKey]);
    });

    it('accepts a temporary password', async () => {
      await redis.set(`tmpPass:${APP_ID}:${ACCOUNT}`, 'temporary-sample', 'PX', 60000);

      const response = await login('temporary-sample');

      expect(response.body.code).toBe('SUCCESS');
      expect(compare).not.toHaveBeenCalled();
    });

    it('limits reset password mails for members without a password', async () => {
      currentMember = { ...member, passhash: null };

      expect((await login('any')).body.code).toBe('I_RESET_PASSWORD');
      expect((await login('any')).body.code).toBe('I_RESET_PASSWORD');

      expect(mailService.insertEmailJobIntoQueue).toHaveBeenCalledTimes(1);
      expect(redis.keys('auth:reset-password:')).toEqual([`auth:reset-password:app:${member.id}`]);
      const kindValues = { ...keyValues, kind: 'reset-password:app' };
      expect(redis.ttl(fill(fixture.keys.issueCooldown.key, kindValues))).toBe(fixture.keys.issueCooldown.ttlSeconds);
      expect(await redis.get(fill(fixture.keys.issueCount.key, kindValues))).toBe('1');
    });
  });

  describe('device challenges', () => {
    it('writes the device login challenge in the fixture format before E_LOGIN_DEVICE', async () => {
      deviceService.checkAndBindDevices.mockResolvedValue(LoginDeviceStatus.LOGIN_LIMIT_EXCEED);

      const response = await login();

      expect(response.body.code).toBe('E_LOGIN_DEVICE');
      const key = fill(fixture.keys.deviceLoginLimit.key, keyValues);
      expect(await redis.get(key)).toBe(fill(fixture.keys.deviceLoginLimit.value, keyValues));
      expect(redis.ttl(key)).toBe(fixture.keys.deviceLoginLimit.ttlSeconds);
      expect(await matchDeviceLoginChallenge(redis, APP_ID, member.id, FINGERPRINT)).toBe(true);
    });

    it('writes the device bind challenge in the fixture format and sends the code before E_BIND_DEVICE', async () => {
      deviceService.checkAndBindDevices.mockResolvedValue(LoginDeviceStatus.BIND_LIMIT_EXCEED);

      const response = await login();

      expect(response.body.code).toBe('E_BIND_DEVICE');
      const key = fill(fixture.keys.deviceBind.key, keyValues);
      expect(await redis.get(key)).toBe(fill(fixture.keys.deviceBind.value, keyValues));
      expect(redis.ttl(key)).toBe(fixture.keys.deviceBind.ttlSeconds);
      expect(mailVerificationCodeService.sendDeviceBindCode).toHaveBeenCalledWith(
        APP_ID,
        member.email,
        'bind-device-limit',
        undefined,
        null,
      );
    });

    it('neither writes the bind challenge nor sends a code at the failure cap', async () => {
      deviceService.checkAndBindDevices.mockResolvedValue(LoginDeviceStatus.BIND_LIMIT_EXCEED);
      await redis.set(fill(fixture.keys.deviceBindFail.key, keyValues), String(fixture.keys.deviceBindFail.cap));

      const response = await login();

      expect(response.body.code).toBe('E_BIND_DEVICE');
      expect(await redis.get(fill(fixture.keys.deviceBind.key, keyValues))).toBeNull();
      expect(mailVerificationCodeService.sendDeviceBindCode).not.toHaveBeenCalled();
    });
  });
});
