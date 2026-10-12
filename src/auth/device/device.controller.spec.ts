import 'reflect-metadata';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Logger, MiddlewareConsumer, Module, RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

import { ApiExceptionFilter } from '~/api.filter';
import { CacheService } from '~/utility/cache/cache.service';
import { DeviceController } from './device.controller';
import DeviceService from './device.service';
import { fingerprintHash } from '../auth-limits';
import { FakeRedis } from '../testing/fake-redis';
import { AppService } from '~/app/app.service';

jest.mock('~/app/app.service', () => ({ AppService: class AppService {} }));
jest.mock('./device.service', () => ({ __esModule: true, default: class DeviceService {} }));
jest.mock('~/utility/cache/cache.service', () => ({ CacheService: class CacheService {} }));

const fixture = JSON.parse(readFileSync(join(__dirname, '..', 'auth-limits.fixture.json'), 'utf8'));

const APP_ID = 'first-app';
const MEMBER_ID = 'member-sample';
const FINGERPRINT = 'fp-sample';
const apps: Record<string, any> = {
  'first.example.test': { id: APP_ID, host: 'first.example.test', settings: {}, modules: [] },
};

let redis: FakeRedis;
const deviceService = {
  getFingerPrintFromUa: jest.fn((fingerPrint: string) => fingerPrint),
  getLoginDevices: jest.fn(async () => [{ id: 'device-1' }, { id: 'device-2' }]),
  checkLoginDeviceReachedLimit: jest.fn(async () => true),
  logoutExcessDevices: jest.fn(async () => undefined),
};
const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const challengeKey = fixture.keys.deviceLoginLimit.key.replace('<appId>', APP_ID).replace('<memberId>', MEMBER_ID);
const writeChallengeLikeOtherService = (fingerPrintId: string) =>
  redis.set(
    challengeKey,
    fixture.keys.deviceLoginLimit.value.replace('<fpHash>', fingerprintHash(fingerPrintId)),
    'EX',
    fixture.keys.deviceLoginLimit.ttlSeconds,
  );

@Module({
  controllers: [DeviceController],
  providers: [
    { provide: DeviceService, useValue: deviceService },
    { provide: CacheService, useValue: { getClient: () => redis } },
    // requests here carry no Origin, so the same-site guard never looks up the request host app
    { provide: AppService, useValue: { getAppInfoByHost: jest.fn(), getAppHostNames: jest.fn() } },
    { provide: Logger, useValue: logger },
  ],
})
class TestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: any, res: any, next: () => void) => {
        res.locals.appCache = apps[String(req.headers.host)];
        req.cookies = {};
        next();
      })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

describe('device login limit management', () => {
  let app: NestExpressApplication;

  const manage = (body: Record<string, unknown>, host = 'first.example.test') =>
    request(app.getHttpServer()).post('/api/v2/device/manage-logged-in-limit').set('Host', host).send(body);

  beforeAll(async () => {
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
    await app?.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    redis = new FakeRedis();
  });

  const expectNoLogout = () => {
    expect(deviceService.getLoginDevices).not.toHaveBeenCalled();
    expect(deviceService.logoutExcessDevices).not.toHaveBeenCalled();
  };

  it('requires a recent login challenge', async () => {
    const response = await manage({ appId: APP_ID, memberId: MEMBER_ID, fingerPrintId: FINGERPRINT });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ code: 'E_DEVICE_CHALLENGE', message: 'device challenge required', result: null });
    expectNoLogout();
  });

  it('requires the challenge to come from the same browser', async () => {
    await writeChallengeLikeOtherService('fp-other-browser');

    const response = await manage({ appId: APP_ID, memberId: MEMBER_ID, fingerPrintId: FINGERPRINT });

    expect(response.body.code).toBe('E_DEVICE_CHALLENGE');
    expectNoLogout();
    expect(await redis.get(challengeKey)).not.toBeNull();
  });

  it('requires the challenge of the same member', async () => {
    await writeChallengeLikeOtherService(FINGERPRINT);

    const response = await manage({ appId: APP_ID, memberId: 'member-other', fingerPrintId: FINGERPRINT });

    expect(response.body.code).toBe('E_DEVICE_CHALLENGE');
    expectNoLogout();
  });

  it('signs out older devices with a matching challenge and consumes it', async () => {
    await writeChallengeLikeOtherService(FINGERPRINT);

    const response = await manage({ appId: APP_ID, memberId: MEMBER_ID, fingerPrintId: FINGERPRINT });

    expect(response.body.code).toBe('SUCCESS');
    expect(deviceService.logoutExcessDevices).toHaveBeenCalledWith(MEMBER_ID, apps['first.example.test']);
    expect(await redis.get(challengeKey)).toBeNull();

    const again = await manage({ appId: APP_ID, memberId: MEMBER_ID, fingerPrintId: FINGERPRINT });
    expect(again.body.code).toBe('E_DEVICE_CHALLENGE');
    expect(deviceService.logoutExcessDevices).toHaveBeenCalledTimes(1);
  });

  it('rejects an appId that differs from the request host app', async () => {
    await writeChallengeLikeOtherService(FINGERPRINT);

    const response = await manage({ appId: 'second-app', memberId: MEMBER_ID, fingerPrintId: FINGERPRINT });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ code: 'E_APP_MISMATCH', message: 'app mismatch', result: null });
    expectNoLogout();
    expect(await redis.get(challengeKey)).not.toBeNull();
  });

  it('keeps member and fingerprint ids out of responses and logs', async () => {
    await writeChallengeLikeOtherService(FINGERPRINT);
    deviceService.getLoginDevices.mockResolvedValueOnce([]);

    const response = await manage({ appId: APP_ID, memberId: MEMBER_ID, fingerPrintId: FINGERPRINT });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('E_MANAGE_LOGGED_IN_DEVICE');
    const written = JSON.stringify([response.body, logger.log.mock.calls, logger.error.mock.calls]);
    expect(written).not.toContain(MEMBER_ID);
    expect(written).not.toContain(FINGERPRINT);
    expect(await redis.get(challengeKey)).not.toBeNull();
  });
});
