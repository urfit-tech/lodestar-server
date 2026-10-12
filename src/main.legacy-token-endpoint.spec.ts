import 'reflect-metadata';
import { Controller, Get, Logger as NestLogger, MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestApplication } from '@nestjs/core/nest-application';
import { NestExpressApplication } from '@nestjs/platform-express';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import DeviceService from './auth/device/device.service';
import MailVerificationCodeService from './mailVerificationCode/mailVerificationCode.service';
import { CacheService } from './utility/cache/cache.service';

// No ApplicationModule, worker module, config-file loader, DB or Redis is initialized.
// The real main.ts bootstrap, Nest factory, Express adapter and auth controller run.
jest.mock('./application.module', () => ({ ApplicationModule: TestApplicationModule }));
jest.mock('./runner/runner.module', () => ({ RunnerModule: {} }));
jest.mock('./runner/runner.type', () => ({ RunnerType: {} }));
jest.mock('./tasker/tasker.module', () => ({ TaskerModule: {} }));
jest.mock('./tasker/tasker.type', () => ({ TaskerType: {} }));
jest.mock('./tasker/watchdog', () => ({ startTaskerWatchdog: jest.fn() }));
jest.mock('./member/member.module', () => ({ MemberModule: class MemberModule {} }));
jest.mock('./auth/auth.module', () => ({ AuthModule: class AuthModule {} }));
jest.mock('./swagger-config/swagger-config.service', () => ({ SwaggerConfigService: { setupSwagger: jest.fn() } }));
jest.mock('./utility/cache/cache.service', () => ({ CacheService: class CacheService {} }));
jest.mock('./member/member.infra', () => ({ MemberInfrastructure: class MemberInfrastructure {} }));
jest.mock('./member/member.service', () => ({ MemberService: class MemberService {} }));
jest.mock('./app/app.service', () => ({ AppService: class AppService {} }));
jest.mock('./mailer/email/email.service', () => ({ EmailService: class EmailService {} }));
jest.mock('./utility/utility.service', () => ({ UtilityService: class UtilityService {} }));
jest.mock('./auth/auth.infra', () => ({ AuthInfrastructure: class AuthInfrastructure {} }));
jest.mock('./auth/device/device.service', () => ({ __esModule: true, default: class DeviceService {} }));
jest.mock('./mailVerificationCode/mailVerificationCode.service', () => ({
  __esModule: true,
  default: class MailVerificationCodeService {},
}));
jest.mock('./auth/permission.guard', () => ({ PermissionGuard: class PermissionGuard {} }));
jest.mock('bcrypt', () => ({ compareSync: jest.fn() }));
jest.mock('connect-redis', () => ({ __esModule: true, default: class RedisStore {} }));
jest.mock('express-session', () => () => mockSession);
jest.mock('./cors', () => ({ __esModule: true, default: (req: any, cb: any) => mockCors(req, cb) }));

const mockSession = jest.fn((req, _res, next) => {
  req.session = {};
  next();
});
const mockCors = jest.fn((_req, cb) => cb(null, { origin: false }));
const mockTenant = jest.fn((_req, res, next) => {
  res.locals.appCache = { id: 'synthetic-app' };
  next();
});
const mockPayloadLog = jest.fn();
const mockPinoWrite = jest.fn();
const mockDatabase = jest.fn();
const mockLookup = jest.fn();
const mockSign = jest.fn();
const config = new ConfigService({
  NODE_ENV: 'test',
  SESSION_SECRET: 'synthetic-session',
  HASURA_JWT_SECRET: 'synthetic-jwt',
});
const service = new AuthService(
  new NestLogger(),
  config,
  { getAppByClientId: mockLookup } as any,
  {} as any,
  {} as any,
  {} as any,
  {} as any,
  {} as any,
  {} as any,
  {} as any,
  { transaction: mockDatabase } as any,
);
(service as any).signJWT = mockSign;

@Controller('healthz')
class HealthController {
  @Get()
  health() {
    return { ok: true };
  }
}

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: [
        {
          serializers: {
            req: req => {
              mockPayloadLog(req);
              return { id: req.id };
            },
          },
        },
        { write: chunk => mockPinoWrite(chunk) },
      ],
    }),
  ],
  controllers: [AuthController, HealthController],
  providers: [
    { provide: AuthService, useValue: service },
    { provide: DeviceService, useValue: {} },
    { provide: MailVerificationCodeService, useValue: {} },
    { provide: NestLogger, useValue: new NestLogger() },
    { provide: ConfigService, useValue: config },
    { provide: CacheService, useValue: { getClient: () => ({}) } },
  ],
})
class TestApplicationModule {
  configure(consumer: MiddlewareConsumer) {
    // Same Nest module phase as production AppMiddleware and nestjs-pino.
    consumer.apply(mockTenant).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

const originalWorkerName = process.env.WORKER_NAME;
let app: NestExpressApplication;
let factorySpy: jest.SpyInstance;
let listenSpy: jest.SpyInstance;

const resetSideEffects = () => {
  jest.clearAllMocks();
  mockDatabase.mockImplementation(cb => cb({}));
  mockLookup.mockResolvedValue({
    id: 'synthetic-app',
    appSecrets: [{ key: 'auth.service.key', value: 'sample-key' }],
  });
  mockSign.mockResolvedValue('signed-token-sample');
};

describe('main bootstrap legacy token endpoint', () => {
  beforeAll(async () => {
    delete process.env.WORKER_NAME;
    const realCreate = NestFactory.create.bind(NestFactory);
    let ready: () => void;
    let fail: (error: unknown) => void;
    const listening = new Promise<void>((resolve, reject) => {
      ready = resolve;
      fail = reject;
    });
    const listen = NestApplication.prototype.listen;
    listenSpy = jest.spyOn(NestApplication.prototype, 'listen').mockImplementation(async function () {
      try {
        const result = await listen.call(this, 0, '127.0.0.1');
        ready();
        return result;
      } catch (error) {
        fail(error);
        throw error;
      }
    });
    factorySpy = jest.spyOn(NestFactory, 'create').mockImplementation(async (module, options: any) => {
      app = await realCreate(module, { ...options, logger: false, abortOnError: false });
      return app;
    });
    require('./main');
    await listening;
  });
  afterAll(async () => {
    await app?.close();
    factorySpy?.mockRestore();
    listenSpy?.mockRestore();
    if (originalWorkerName === undefined) delete process.env.WORKER_NAME;
    else process.env.WORKER_NAME = originalWorkerName;
  });
  beforeEach(resetSideEffects);

  it('runs the real bootstrap and downstream middleware for ordinary traffic', async () => {
    expect((await request(app.getHttpServer()).get('/healthz')).status).toBe(200);
    expect(mockSession).toHaveBeenCalled();
    expect(mockCors).toHaveBeenCalled();
    expect(mockTenant).toHaveBeenCalled();
    expect(mockPayloadLog).toHaveBeenCalled();
    expect(mockPinoWrite).toHaveBeenCalled();
  });

  it.each(['1', '2'])('answers v%s with 503 before body parsing, session, CORS, tenant and pino', async version => {
    const variants = [
      `/api/v${version}/auth/token`,
      `/API/V${version}/AUTH/TOKEN/`,
      `/api/v${version}//auth/token`,
      `/api/v${version}/auth//token`,
      `/api//v${version}/auth/token`,
      `/api/v${version}/auth/token/?key=query-sample`,
    ];
    const bodies = [
      ['application/json', '{"clientId":"known-client","key":"sample-key","permissions":["sample"]}'],
      ['application/json', '{malformed-sample'],
      ['application/x-www-form-urlencoded', 'clientId=known-client&key=sample-key'],
      [
        'multipart/form-data; boundary=synthetic',
        '--synthetic\r\nContent-Disposition: form-data; name="key"\r\n\r\nsample-key\r\n--synthetic--\r\n',
      ],
    ];
    for (const path of variants)
      for (const [type, body] of bodies) {
        resetSideEffects();
        const response = await request(app.getHttpServer())
          .post(path)
          .set('Host', 'unknown.example.test')
          .set('Authorization', 'Bearer sample-bearer')
          .set('Content-Type', type)
          .send(body);
        expect({ path, type, status: response.status }).toEqual({ path, type, status: 503 });
        expect(response.headers['cache-control']).toBe('no-store');
        expect(response.body).toEqual({
          code: 'E_AUTH_TOKEN',
          message: 'this endpoint has been retired',
          result: null,
        });
        for (const sideEffect of [
          mockSession,
          mockCors,
          mockTenant,
          mockPayloadLog,
          mockPinoWrite,
          mockDatabase,
          mockLookup,
          mockSign,
        ]) {
          expect(sideEffect).not.toHaveBeenCalled();
        }
      }
  });

  it('leaves unrelated paths and methods to normal routing', async () => {
    expect((await request(app.getHttpServer()).get('/api/v1/auth/token')).status).toBe(404);
    expect((await request(app.getHttpServer()).post('/api/v1/auth/token-extra')).status).toBe(404);
    expect(mockSession).toHaveBeenCalled();
  });

  it('controller handler returns the retired response without calling the service', () => {
    const response = { setHeader: jest.fn(), status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);
    app.get(AuthController).retiredTokenEndpoint(response as any);
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(mockDatabase).not.toHaveBeenCalled();
    expect(mockSign).not.toHaveBeenCalled();
  });

  it('service method rejects direct callers without lookup or signing', async () => {
    await expect(
      Reflect.apply(service.generateCrossServerToken, service, [
        {},
        {
          clientId: 'known-client',
          key: 'sample-key',
          permissions: ['sample'],
        },
      ]),
    ).rejects.toMatchObject({ status: 503 });
    expect(mockDatabase).not.toHaveBeenCalled();
    expect(mockLookup).not.toHaveBeenCalled();
    expect(mockSign).not.toHaveBeenCalled();
  });
});
