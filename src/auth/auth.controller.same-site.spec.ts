import { Logger, MiddlewareConsumer, Module, RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import 'reflect-metadata';
import request from 'supertest';

import { ApiExceptionFilter } from '~/api.filter';
import MailVerificationCodeService from '~/mailVerificationCode/mailVerificationCode.service';
import { CacheService } from '~/utility/cache/cache.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginStatus, RefreshStatus } from './auth.type';
import { DeviceController } from './device/device.controller';
import DeviceService from './device/device.service';
import { FakeRedis } from './testing/fake-redis';

jest.mock('./auth.service', () => ({ AuthService: class AuthService {} }));
jest.mock('./device/device.service', () => ({ __esModule: true, default: class DeviceService {} }));
jest.mock('~/utility/cache/cache.service', () => ({ CacheService: class CacheService {} }));
jest.mock('~/mailVerificationCode/mailVerificationCode.service', () => ({
  __esModule: true,
  default: class MailVerificationCodeService {},
}));
jest.mock('./permission.guard', () => ({ PermissionGuard: class PermissionGuard {} }));

const APP_ID = 'sample-app';

const authService = {
  generalLogin: jest.fn(async () => ({ status: LoginStatus.E_NO_MEMBER })),
  refreshToken: jest.fn(async () => ({ status: RefreshStatus.E_NO_MEMBER })),
  generateTmpPassword: jest.fn(),
};
const deviceService = {
  getFingerPrintFromUa: jest.fn((fingerPrint: string) => fingerPrint),
  expireFingerPrintId: jest.fn(),
  checkAndBindDevices: jest.fn(),
  getLoginDevices: jest.fn(async () => []),
};
const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
let redis: FakeRedis;
let sessionStore: Record<string, any>;
const sessionReads = jest.fn();

@Module({
  controllers: [AuthController, DeviceController],
  providers: [
    { provide: AuthService, useValue: authService },
    { provide: DeviceService, useValue: deviceService },
    { provide: MailVerificationCodeService, useValue: {} },
    { provide: Logger, useValue: logger },
    { provide: CacheService, useValue: { getClient: () => redis } },
  ],
})
class TestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: any, res: any, next: () => void) => {
        res.locals.appCache = { id: APP_ID, host: String(req.headers.host), settings: {}, modules: [] };
        req.session = new Proxy(sessionStore, {
          get: (target, key) => {
            sessionReads(key);
            return Reflect.get(target, key);
          },
        });
        req.cookies = {};
        next();
      })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

const loginBody = {
  appId: APP_ID,
  account: 'sample-account',
  password: 'sample-password',
  fingerPrintId: 'fp-body',
  geoLocation: { ip: null, country: null, countryCode: null },
};
const refreshBody = {
  appId: APP_ID,
  fingerPrintId: 'fp-body',
  geoLocation: { ip: null, country: null, countryCode: null },
};

const routes: Array<[string, string, Record<string, unknown>]> = [
  ['v1 general-login', '/api/v1/auth/general-login', loginBody],
  ['v2 general-login', '/api/v2/auth/general-login', loginBody],
  ['v1 refresh-token', '/api/v1/auth/refresh-token', refreshBody],
  ['v2 refresh-token', '/api/v2/auth/refresh-token', refreshBody],
];

describe('session endpoints accept only same-site requests', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let app: NestExpressApplication;
  let warn: jest.SpyInstance;

  const post = (path: string, host: string, headers: Record<string, string>, body: Record<string, unknown>) => {
    let pending = request(app.getHttpServer()).post(path).set('Host', host);
    for (const [name, value] of Object.entries(headers)) {
      pending = pending.set(name, value);
    }
    return pending.send(body);
  };

  const expectNoHandlerEffects = () => {
    expect(authService.generalLogin).not.toHaveBeenCalled();
    expect(authService.refreshToken).not.toHaveBeenCalled();
    expect(deviceService.getFingerPrintFromUa).not.toHaveBeenCalled();
    expect(deviceService.expireFingerPrintId).not.toHaveBeenCalled();
    expect(deviceService.getLoginDevices).not.toHaveBeenCalled();
    expect(sessionReads).not.toHaveBeenCalled();
    expect(redis.calls).toEqual([]);
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'production';
    const moduleRef = await Test.createTestingModule({ imports: [TestModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    app
      .useGlobalPipes(new ValidationPipe())
      .useGlobalFilters(new ApiExceptionFilter())
      .setGlobalPrefix('api')
      .enableVersioning({ type: VersioningType.URI });
    await app.init();
  });

  afterAll(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    await app?.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    redis = new FakeRedis();
    sessionStore = {};
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  describe.each(routes)('%s', (_label, path, body) => {
    it.each([
      ['Sec-Fetch-Site cross-site', { 'Sec-Fetch-Site': 'cross-site' }, 'origin_site=- sfs=cross-site'],
      ['an Origin on another domain', { Origin: 'https://www.other-site.com' }, 'origin_site=other-site.com sfs=-'],
      ['Origin null', { Origin: 'null' }, 'origin_site=null sfs=-'],
      ['an unparseable Origin', { Origin: '%%garbage%%' }, 'origin_site=invalid sfs=-'],
      ['an IP Origin', { Origin: 'https://54.249.157.218' }, 'origin_site=invalid sfs=-'],
    ])('rejects %s before the handler runs', async (_case, headers, logged) => {
      const response = await post(path, 'course.taotaoxi.net', headers, body).type('form');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ code: 'E_CROSS_SITE', message: 'cross-site request rejected', result: null });
      expect(response.headers['set-cookie']).toBeUndefined();
      expectNoHandlerEffects();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toBe(`cross-site-auth-reject route=${path} ${logged}`);
    });

    it.each([
      [
        'same origin',
        'course.taotaoxi.net',
        { Origin: 'https://course.taotaoxi.net', 'Sec-Fetch-Site': 'same-origin' },
      ],
      [
        'www.taotaoxi.net to course.taotaoxi.net',
        'course.taotaoxi.net',
        { Origin: 'https://www.taotaoxi.net', 'Sec-Fetch-Site': 'same-site' },
      ],
      [
        'estimators.ming-guang.com to www.ming-guang.com',
        'www.ming-guang.com',
        { Origin: 'https://estimators.ming-guang.com' },
      ],
      [
        'two hosts under the same .com.tw domain',
        'course.commonhealth.com.tw',
        { Origin: 'https://www.commonhealth.com.tw' },
      ],
      ['no Origin', 'course.taotaoxi.net', {}],
    ])('accepts %s', async (_case, host, headers) => {
      const response = await post(path, host, headers, body);

      expect(response.status).toBe(201);
      expect(response.body.code).toBe('E_NO_MEMBER');
      expect(warn).not.toHaveBeenCalled();
    });
  });

  it('accepts a same-site form-encoded login', async () => {
    const response = await post(
      '/api/v1/auth/general-login',
      'course.taotaoxi.net',
      { Origin: 'https://www.taotaoxi.net' },
      loginBody,
    ).type('form');

    expect(response.status).toBe(201);
    expect(authService.generalLogin).toHaveBeenCalledTimes(1);
  });

  it.each([
    '/api/v1/auth/password/temporary',
    '/api/v2/auth/password/temporary',
    '/api/v2/device/manage-logged-in-limit',
  ])('rejects a cross-site POST %s', async path => {
    const response = await post(
      path,
      'course.taotaoxi.net',
      { Origin: 'https://www.other-site.com' },
      { appId: APP_ID },
    );

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('E_CROSS_SITE');
    expect(authService.generateTmpPassword).not.toHaveBeenCalled();
    expectNoHandlerEffects();
  });

  it('lets a same-site device request reach its handler', async () => {
    const response = await post(
      '/api/v2/device/manage-logged-in-limit',
      'course.taotaoxi.net',
      { Origin: 'https://course.taotaoxi.net' },
      { appId: APP_ID, memberId: 'member-sample', fingerPrintId: 'fp-sample' },
    );

    expect(response.status).toBe(201);
    expect(response.body.code).toBe('E_DEVICE_CHALLENGE');
  });

  it('does not affect GET requests', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/general-login')
      .set('Host', 'course.taotaoxi.net')
      .set('Origin', 'https://www.other-site.com')
      .set('Sec-Fetch-Site', 'cross-site');

    expect(response.status).toBe(404);
    expect(warn).not.toHaveBeenCalled();
  });
});
