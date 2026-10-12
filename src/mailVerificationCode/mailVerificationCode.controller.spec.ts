import 'reflect-metadata';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Logger, MiddlewareConsumer, Module, RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

import { ApiExceptionFilter } from '~/api.filter';
import { fingerprintHash, normalizeIdentifier } from '~/auth/auth-limits';
import { FakeRedis } from '~/auth/testing/fake-redis';
import { MailVerificationCodeController } from './mailVerificationCode.controller';
import MailVerificationCodeService from './mailVerificationCode.service';

jest.mock('~/mailer/email/email.service', () => ({ EmailService: class EmailService {} }));
jest.mock('~/app/app.service', () => ({ AppService: class AppService {} }));
jest.mock('~/auth/device/device.infra', () => ({ DeviceInfrastructure: class DeviceInfrastructure {} }));
jest.mock('~/utility/cache/cache.service', () => ({ CacheService: class CacheService {} }));
jest.mock('./mailVerificationCode.infra', () => ({
  MailVerificationCodeInfrastructure: class MailVerificationCodeInfrastructure {},
}));

const fixture = JSON.parse(readFileSync(join(__dirname, '..', 'auth', 'auth-limits.fixture.json'), 'utf8'));

const APP_ID = 'first-app';
const MEMBER_ID = 'member-sample';
const EMAIL = 'member@example.test';
const TYPE = 'bind-device-limit';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const apps: Record<string, any> = {
  'first.example.test': { id: APP_ID, host: 'first.example.test', name: 'first', settings: {}, modules: [] },
};

type Code = { id: string; appId: string; email: string; type: string; code: string; expiredAt: Date };
let codes: Code[];
let devices: Array<{ id: string; createdAt: Date }>;
let redis: FakeRedis;
let nextId = 0;

const codeInfra = {
  getUnexpiredMailVerificationCodesByEmail: jest.fn(async (appId: string, email: string, type: string) =>
    codes.filter(c => c.appId === appId && c.email === email && c.type === type && c.expiredAt > new Date()),
  ),
  updateMailVerificationCodesToNow: jest.fn(async (ids: string[], appId: string, email: string, type: string) => {
    const now = new Date(Date.now() - 1);
    codes
      .filter(c => c.appId === appId && c.email === email && c.type === type && (!ids.length || ids.includes(c.id)))
      .forEach(c => (c.expiredAt = now));
  }),
  insertVerificationCode: jest.fn(async (appId: string, email: string, type: string, code: string, ms: number) => {
    codes.push({ id: `code-${nextId++}`, appId, email, type, code, expiredAt: new Date(Date.now() + ms - 1000) }); // issued a second ago
  }),
};
const deviceInfra = {
  getMemberDevices: jest.fn(async () => devices),
  deleteMemberDeviceById: jest.fn(async (id: string) => {
    devices = devices.filter(d => d.id !== id);
  }),
};
const emailService = { insertEmailJobIntoQueue: jest.fn(async () => undefined) };
const appService = { getAppInfo: jest.fn(async () => ({ name: 'first' })) };
const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const service = new MailVerificationCodeService(
  codeInfra as any,
  deviceInfra as any,
  emailService as any,
  appService as any,
  { getClient: () => redis } as any,
  {} as any,
);

@Module({
  controllers: [MailVerificationCodeController],
  providers: [
    { provide: MailVerificationCodeService, useValue: service },
    { provide: Logger, useValue: logger },
  ],
})
class TestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: any, res: any, next: () => void) => {
        res.locals.appCache = apps[String(req.headers.host)];
        next();
      })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

const bindKey = (email = EMAIL) =>
  fixture.keys.deviceBind.key.replace('<appId>', APP_ID).replace('<norm(email)>', normalizeIdentifier(email));
const failKey = (memberId = MEMBER_ID) =>
  fixture.keys.deviceBindFail.key.replace('<appId>', APP_ID).replace('<memberId>', memberId);
const cooldownKey = fixture.keys.deviceBindSendCooldown.key.replace('<appId>', APP_ID).replace('<memberId>', MEMBER_ID);

/** Writes the device bind challenge the way the other service does (fixture format). */
const writeBindChallenge = (memberId = MEMBER_ID, email = EMAIL) =>
  redis.set(
    bindKey(email),
    fixture.keys.deviceBind.value.replace('<memberId>', memberId),
    'EX',
    fixture.keys.deviceBind.ttlSeconds,
  );

const sentCodes = () => (emailService.insertEmailJobIntoQueue.mock.calls as any[]).map(([job]) => job.partials.code);

describe('device bind mail verification codes', () => {
  let app: NestExpressApplication;

  const send = (body: Record<string, unknown>, host = 'first.example.test') =>
    request(app.getHttpServer())
      .post('/api/v2/mail-verification-code/send')
      .set('Host', host)
      .set('User-Agent', UA)
      .send(body);
  const verify = (body: Record<string, unknown>, host = 'first.example.test') =>
    request(app.getHttpServer()).post('/api/v2/mail-verification-code/verify').set('Host', host).send(body);
  const sendBody = { appId: APP_ID, email: EMAIL, type: TYPE, ip: null };
  const verifyBody = (code: string, memberId = MEMBER_ID) => ({
    appId: APP_ID,
    email: EMAIL,
    memberId,
    type: TYPE,
    code,
  });
  const issueCode = async () => {
    await send(sendBody);
    const all = sentCodes();
    return all[all.length - 1] as string;
  };
  const wrongCode = (code: string) => (code === '0000' ? '0001' : '0000');

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [TestModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
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
    codes = [];
    devices = [
      { id: 'device-old', createdAt: new Date('2026-01-01') },
      { id: 'device-new', createdAt: new Date('2026-02-01') },
    ];
  });

  const SUCCESS_SEND = { code: 'SUCCESS', message: 'Sent verification email successfully', result: null };

  describe('send', () => {
    it('answers the same without sending when no bind challenge exists', async () => {
      const response = await send(sendBody);
      expect(response.body).toEqual(SUCCESS_SEND);
      expect(emailService.insertEmailJobIntoQueue).not.toHaveBeenCalled();
      expect(codeInfra.insertVerificationCode).not.toHaveBeenCalled();
    });

    it('sends to the email of a bind challenge written in the fixture format', async () => {
      await writeBindChallenge();
      const response = await send({ ...sendBody, email: '  Member@Example.TEST ' });
      expect(response.body).toEqual(SUCCESS_SEND);
      expect(emailService.insertEmailJobIntoQueue).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(response.body)).not.toContain(sentCodes()[0]);
    });

    it('only accepts the bind-device-limit type', async () => {
      await writeBindChallenge();
      const response = await send({ ...sendBody, type: 'login-device-limit' });
      expect(response.body).toEqual(SUCCESS_SEND);
      expect(emailService.insertEmailJobIntoQueue).not.toHaveBeenCalled();
    });

    it('sends at most once per cooldown', async () => {
      await writeBindChallenge();
      await send(sendBody);
      const second = await send(sendBody);
      expect(second.body).toEqual(SUCCESS_SEND);
      expect(emailService.insertEmailJobIntoQueue).toHaveBeenCalledTimes(1);
    });

    it('sends at most the hourly cap', async () => {
      await writeBindChallenge();
      for (let i = 0; i < fixture.keys.deviceBindSendCount.cap + 2; i++) {
        await redis.del(cooldownKey);
        expect((await send(sendBody)).body).toEqual(SUCCESS_SEND);
      }
      expect(emailService.insertEmailJobIntoQueue).toHaveBeenCalledTimes(fixture.keys.deviceBindSendCount.cap);
    });

    it('rejects an appId that differs from the request host app', async () => {
      await writeBindChallenge();
      const response = await send({ ...sendBody, appId: 'second-app' });
      expect(response.status).toBe(403);
      expect(emailService.insertEmailJobIntoQueue).not.toHaveBeenCalled();
    });

    it('keeps the email out of logs', async () => {
      await writeBindChallenge();
      appService.getAppInfo.mockRejectedValueOnce(new Error('lookup failed'));
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      await send(sendBody);
      const written = JSON.stringify([consoleError.mock.calls, logger.error.mock.calls, logger.log.mock.calls]);
      consoleError.mockRestore();
      expect(written).not.toContain(EMAIL);
    });
  });

  describe('verify', () => {
    const FAILED = { code: 'E_VERIFICATION_FAILED', message: 'Verification failed.', result: null };

    it('fails without a bind challenge and leaves devices untouched', async () => {
      codes.push({
        id: 'c',
        appId: APP_ID,
        email: EMAIL,
        type: TYPE,
        code: '1234',
        expiredAt: new Date(Date.now() + 60000),
      });
      const response = await verify(verifyBody('1234'));
      expect(response.body).toEqual(FAILED);
      expect(deviceInfra.deleteMemberDeviceById).not.toHaveBeenCalled();
    });

    it('fails when the memberId is not the one of the bind challenge', async () => {
      await writeBindChallenge();
      const code = await issueCode();
      const response = await verify(verifyBody(code, 'member-other'));
      expect(response.body).toEqual(FAILED);
      expect(deviceInfra.getMemberDevices).not.toHaveBeenCalled();
      expect(deviceInfra.deleteMemberDeviceById).not.toHaveBeenCalled();
    });

    it('removes the oldest device and consumes the challenge with the right code', async () => {
      await writeBindChallenge();
      const code = await issueCode();
      const response = await verify(verifyBody(code));
      expect(response.body).toEqual({
        code: 'SUCCESS',
        message: 'Verification code validated successfully',
        result: null,
      });
      expect(deviceInfra.deleteMemberDeviceById).toHaveBeenCalledWith('device-old', expect.anything());
      expect(await redis.get(bindKey())).toBeNull();
      expect(Number(await redis.get(failKey())) || 0).toBe(0);
      expect((await verify(verifyBody(code))).body).toEqual(FAILED);
      expect(deviceInfra.deleteMemberDeviceById).toHaveBeenCalledTimes(1);
    });

    it('counts wrong codes and never returns the code', async () => {
      await writeBindChallenge();
      const code = await issueCode();
      const response = await verify(verifyBody(wrongCode(code)));
      expect(response.body).toEqual(FAILED);
      expect(JSON.stringify(response.body)).not.toContain(wrongCode(code));
      expect(await redis.get(failKey())).toBe('1');
      expect(redis.ttl(failKey())).toBe(fixture.keys.deviceBindFail.ttlSeconds);
      expect(deviceInfra.deleteMemberDeviceById).not.toHaveBeenCalled();
    });

    it('drops the challenge and outstanding codes at the failure cap', async () => {
      await writeBindChallenge();
      const code = await issueCode();
      for (let i = 0; i < fixture.keys.deviceBindFail.cap; i++) {
        expect((await verify(verifyBody(wrongCode(code)))).body).toEqual(FAILED);
      }
      expect(await redis.get(failKey())).toBe(String(fixture.keys.deviceBindFail.cap));
      expect(await redis.get(bindKey())).toBeNull();
      expect(codes.every(c => c.expiredAt <= new Date())).toBe(true);
      expect(deviceInfra.deleteMemberDeviceById).not.toHaveBeenCalled();
    });

    it('keeps rejecting the right code at the failure cap even after the challenge is written again', async () => {
      await writeBindChallenge();
      const code = await issueCode();
      await redis.set(failKey(), String(fixture.keys.deviceBindFail.cap));
      await writeBindChallenge();
      codeInfra.getUnexpiredMailVerificationCodesByEmail.mockClear();

      const response = await verify(verifyBody(code));

      expect(response.body).toEqual(FAILED);
      expect(codeInfra.getUnexpiredMailVerificationCodesByEmail).not.toHaveBeenCalled();
      expect(deviceInfra.getMemberDevices).not.toHaveBeenCalled();
      expect(deviceInfra.deleteMemberDeviceById).not.toHaveBeenCalled();
      expect(devices).toHaveLength(2);
    });

    it('checks at most the cap of codes under concurrent attempts', async () => {
      await writeBindChallenge();
      const code = await issueCode();
      codeInfra.getUnexpiredMailVerificationCodesByEmail.mockClear();

      const responses = await Promise.all(
        Array.from({ length: 40 }, (_, i) => verify(verifyBody(String(i).padStart(4, '9')))),
      );

      expect(responses.every(r => r.body.code === 'E_VERIFICATION_FAILED' || r.body.code === 'SUCCESS')).toBe(true);
      expect(codeInfra.getUnexpiredMailVerificationCodesByEmail.mock.calls.length).toBeLessThanOrEqual(
        // one lookup per compared attempt plus the cleanup lookup at the cap
        fixture.keys.deviceBindFail.cap + 1,
      );
      expect(code).toBeDefined();
    });

    it('rejects an appId that differs from the request host app', async () => {
      await writeBindChallenge();
      const code = await issueCode();
      const response = await verify({ ...verifyBody(code), appId: 'second-app' });
      expect(response.status).toBe(403);
      expect(deviceInfra.deleteMemberDeviceById).not.toHaveBeenCalled();
    });

    it('accepts only the bind-device-limit type', async () => {
      await writeBindChallenge();
      const code = await issueCode();
      const response = await verify({ ...verifyBody(code), type: 'login-device-limit' });
      expect(response.body).toEqual(FAILED);
      expect(deviceInfra.deleteMemberDeviceById).not.toHaveBeenCalled();
    });
  });

  it('uses the shared fingerprint hash helper', () => {
    expect(fingerprintHash('x')).toHaveLength(64);
  });
});
