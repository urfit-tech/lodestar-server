import 'reflect-metadata';
import { Logger, MiddlewareConsumer, Module, RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { sign } from 'jsonwebtoken';
import request from 'supertest';

import { ApiExceptionFilter } from '~/api.filter';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthInfrastructure } from './auth.infra';
import { AccessControlService } from './access-control.service';
import { AuthAuditLog } from './entity/auth_audit_log.entity';
import DeviceService from './device/device.service';
import MailVerificationCodeService from '~/mailVerificationCode/mailVerificationCode.service';
import { CacheService } from '~/utility/cache/cache.service';
import { AppService } from '~/app/app.service';

// No DB, Redis or native modules: the real controller, guards, AuthService and AuthInfrastructure run
// against an in-memory member table that evaluates the parameterised member queries.
jest.mock('bcrypt', () => ({ compare: async (password: string, hash: string) => hash === `hash:${password}` }));
jest.mock('~/member/member.infra', () => ({ MemberInfrastructure: class MemberInfrastructure {} }));
jest.mock('~/member/member.service', () => ({ MemberService: class MemberService {} }));
jest.mock('~/app/app.service', () => ({ AppService: class AppService {} }));
jest.mock('~/mailer/email/email.service', () => ({ EmailService: class EmailService {} }));
jest.mock('~/utility/utility.service', () => ({ UtilityService: class UtilityService {} }));
jest.mock('~/utility/cache/cache.service', () => ({ CacheService: class CacheService {} }));
jest.mock('./device/device.service', () => ({ __esModule: true, default: class DeviceService {} }));
jest.mock('~/mailVerificationCode/mailVerificationCode.service', () => ({
  __esModule: true,
  default: class MailVerificationCodeService {},
}));

const JWT_SECRET = 'synthetic-jwt-secret';
const PERMISSION = 'APP_TMP_PASSWORD_ADMIN';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

const apps: Record<string, any> = {
  'first.example.test': { id: 'first-app', orgId: 'first-org', host: 'first.example.test', modules: [] },
  'second.example.test': { id: 'second-app', orgId: 'second-org', host: 'second.example.test', modules: [] },
};

type Row = { id: string; app_id: string; email: string; role: string };
const memberTable: Row[] = [
  { id: 'owner', app_id: 'first-app', email: 'owner@example.test', role: 'app-owner' },
  { id: 'co-owner', app_id: 'first-app', email: 'co-owner@example.test', role: 'app-owner' },
  { id: 'helper', app_id: 'first-app', email: 'helper@example.test', role: 'general-member' },
  { id: 'revoked', app_id: 'first-app', email: 'revoked@example.test', role: 'general-member' },
  { id: 'mixed', app_id: 'first-app', email: 'Mixed.Case@Example.test', role: 'general-member' },
  { id: 'dup-lower', app_id: 'first-app', email: 'dup@example.test', role: 'general-member' },
  { id: 'dup-upper', app_id: 'first-app', email: 'DUP@example.test', role: 'general-member' },
  { id: 'plain', app_id: 'first-app', email: 'axbyc@example.test', role: 'general-member' },
  { id: 'second-owner', app_id: 'second-app', email: 'second-owner@example.test', role: 'app-owner' },
  { id: 'second-target', app_id: 'second-app', email: 'second@example.test', role: 'general-member' },
];
// current contents of the member_permission view for the permission under test
const grantedNow = new Set(['owner', 'co-owner', 'helper', 'second-owner']);

const queries: Array<{ sql: string; params: unknown[] }> = [];
const evaluateQuery = async (sql: string, params: unknown[]) => {
  queries.push({ sql, params });
  if (sql.includes('member_permission')) {
    const [memberId, appId, permissionId] = params as string[];
    const row = memberTable.find(m => m.id === memberId && m.app_id === appId);
    return row
      ? [{ id: row.id, role: row.role, has_permission: permissionId === PERMISSION && grantedNow.has(row.id) }]
      : [];
  }
  const [appId, email] = params as string[];
  const inApp = memberTable.filter(m => m.app_id === appId);
  const matches = sql.includes('lower(email) = lower($2)')
    ? inApp.filter(m => m.email.toLowerCase() === email.toLowerCase())
    : inApp.filter(m => m.email === email);
  return matches.slice(0, 2).map(({ id, email, role }) => ({ id, email, role }));
};

const auditInsert = jest.fn<Promise<object>, [AuthAuditLog]>(async () => ({}));
const entityManager = {
  query: jest.fn(evaluateQuery),
  getRepository: (entity: unknown) => {
    if (entity !== AuthAuditLog) throw new Error('unexpected repository');
    return { insert: auditInsert };
  },
};
const redis = {
  get: jest.fn(async () => null),
  set: jest.fn(async () => 'OK'),
  del: jest.fn(async () => 0),
};
const logger = new Logger();

const authService = new AuthService(
  logger,
  new ConfigService({ NODE_ENV: 'test', HASURA_JWT_SECRET: JWT_SECRET }),
  {} as any,
  {} as any,
  {} as any,
  { getClient: () => redis } as any,
  new AuthInfrastructure(),
  {} as any,
  {} as any,
  {} as any,
  entityManager as any,
);

const hostResolver = (req: any, res: any, next: () => void) => {
  res.locals.appCache = apps[String(req.headers.host)];
  next();
};

@Module({
  controllers: [AuthController],
  providers: [
    { provide: AuthService, useValue: authService },
    { provide: DeviceService, useValue: {} },
    { provide: MailVerificationCodeService, useValue: {} },
    { provide: Logger, useValue: logger },
    { provide: CacheService, useValue: { getClient: () => redis } },
    { provide: AppService, useValue: { getAppInfoByHost: jest.fn(), getAppHostNames: jest.fn() } },
    AccessControlService,
  ],
})
class TestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(hostResolver).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

const tokenFor = (sub: string, claims: Record<string, unknown> = {}) =>
  sign({ sub, appId: 'first-app', role: 'app-owner', permissions: [PERMISSION], ...claims }, JWT_SECRET);

describe('temporary password context', () => {
  let app: NestExpressApplication;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  const issue = (token: string, body: Record<string, unknown>, host = 'first.example.test', version = '2') =>
    request(app.getHttpServer())
      .post(`/api/v${version}/auth/password/temporary`)
      .set('Host', host)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  const expectNothingIssued = () => {
    expect(redis.set).not.toHaveBeenCalled();
    expect(auditInsert).not.toHaveBeenCalled();
  };

  const expectForbidden = (response: request.Response) => {
    expect(response.status).toBe(403);
    expect(response.body.result).toBeNull();
    expect(['E_FORBIDDEN', 'E_APP_MISMATCH']).toContain(response.body.code);
    expectNothingIssued();
  };

  const expectTargetError = (response: request.Response) => {
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      code: 'E_TMP_PASSWORD',
      message: 'failed to generate temporary password',
      result: null,
    });
    expectNothingIssued();
  };

  const expectIssued = (response: request.Response, applicant: string, target: Row) => {
    expect(response.status).toBe(201);
    expect(response.body.code).toBe('SUCCESS');
    expect(response.body.message).toBe('get temporary password successfully');
    const { password, expiredAt } = response.body.result;
    expect(typeof password).toBe('string');
    expect(password).toHaveLength(16);
    expect(Number.isNaN(Date.parse(expiredAt))).toBe(false);
    expect(redis.set).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledWith(`tmpPass:first-app:${target.email}`, password, 'PX', THREE_DAYS_MS);
    expect(auditInsert).toHaveBeenCalledTimes(1);
    const audit = auditInsert.mock.calls[0][0];
    expect(audit.action).toBe('apply_temporary_password');
    expect(audit.memberId).toBe(applicant);
    expect(audit.target).toBe(target.id);
    expect(audit.metadata).toEqual({ reason: 'support', appId: 'first-app' });
    expect(JSON.stringify(audit)).not.toContain(password);
    for (const call of [...warnSpy.mock.calls, ...errorSpy.mock.calls]) {
      expect(JSON.stringify(call)).not.toContain(password);
    }
  };

  const member = (id: string): Row => {
    const row = memberTable.find(m => m.id === id);
    if (!row) throw new Error(`unknown fixture member ${id}`);
    return row;
  };

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
    queries.length = 0;
    warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it.each(['1', '2'])('(a) v%s: rejects a body appId that differs from the session app', async version => {
    const response = await issue(
      tokenFor('owner'),
      { appId: 'second-app', email: 'second@example.test', purpose: 'support' },
      'first.example.test',
      version,
    );

    expectForbidden(response);
    expect(queries).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const warned = JSON.stringify(warnSpy.mock.calls[0]);
    expect(warned).toContain('first-app');
    expect(warned).not.toContain('second@example.test');
  });

  it('(b) rejects a session app that differs from the request host app', async () => {
    const token = tokenFor('second-owner', { appId: 'second-app' });

    expectForbidden(await issue(token, { appId: 'first-app', email: 'mixed.case@example.test', purpose: 'support' }));
    expectForbidden(await issue(token, { email: 'mixed.case@example.test', purpose: 'support' }));
    expect(queries).toHaveLength(0);
  });

  it.each([
    ['without an appId', { appId: undefined }],
    ['with a non-string appId', { appId: ['first-app'] }],
  ])('(c) rejects a session %s', async (_label, claims) => {
    const response = await issue(tokenFor('owner', claims), { email: 'mixed.case@example.test', purpose: 'support' });

    expectForbidden(response);
    expect(queries).toHaveLength(0);
  });

  it('(d) rejects a caller whose permission is no longer granted', async () => {
    const response = await issue(tokenFor('revoked', { role: 'general-member' }), {
      appId: 'first-app',
      email: 'mixed.case@example.test',
      purpose: 'support',
    });

    expectForbidden(response);
    expect(queries).toHaveLength(1);
    expect(queries[0].params).toEqual(['revoked', 'first-app', PERMISSION]);
  });

  it('(d) rejects a caller who is not a member of the session app', async () => {
    const response = await issue(tokenFor('second-owner'), {
      appId: 'first-app',
      email: 'mixed.case@example.test',
      purpose: 'support',
    });

    expectForbidden(response);
  });

  it('(d) rejects a caller unknown to the database', async () => {
    expectForbidden(await issue(tokenFor('nobody'), { email: 'mixed.case@example.test', purpose: 'support' }));
  });

  it('(e) rejects a body applicant that differs from the session member', async () => {
    const response = await issue(tokenFor('owner'), {
      appId: 'first-app',
      applicant: 'helper',
      email: 'mixed.case@example.test',
      purpose: 'support',
    });

    expectForbidden(response);
    expect(queries).toHaveLength(0);
  });

  it('(e) accepts a body applicant equal to the session member, as the admin page sends it', async () => {
    const response = await issue(tokenFor('owner'), {
      appId: 'first-app',
      applicant: 'owner',
      email: 'Mixed.Case@Example.test',
      purpose: 'support',
    });

    expectIssued(response, 'owner', member('mixed'));
  });

  it('(f) issues for an exact email match, keyed by the stored email and audited as the session member', async () => {
    const response = await issue(tokenFor('owner'), { email: 'Mixed.Case@Example.test', purpose: 'support' });

    expectIssued(response, 'owner', member('mixed'));
  });

  it('(f) uses the exact match even when another member differs only in case', async () => {
    const response = await issue(tokenFor('owner'), { email: 'dup@example.test', purpose: 'support' });

    expectIssued(response, 'owner', member('dup-lower'));
  });

  it.each(['mixed.case@example.test', '  MIXED.CASE@EXAMPLE.TEST  '])(
    '(g) issues for a unique case-insensitive match %p, keyed by the stored email',
    async email => {
      const response = await issue(tokenFor('owner'), { email, purpose: 'support' });

      expectIssued(response, 'owner', member('mixed'));
    },
  );

  it('(h) rejects a case-insensitive match that is not unique', async () => {
    expectTargetError(await issue(tokenFor('owner'), { email: 'Dup@Example.test', purpose: 'support' }));
  });

  it.each(['%', '%@example.test', 'a_b_c@example.test', 'axbyc@example.tes_', '_'])(
    '(i) treats %p literally',
    async email => {
      expectTargetError(await issue(tokenFor('owner'), { email, purpose: 'support' }));
      for (const { sql, params } of queries) {
        expect(sql.toLowerCase()).not.toContain('like');
        if (email.length > 1) {
          expect(sql).not.toContain(email);
        }
        expect(params).toContain(sql.includes('member_permission') ? 'owner' : email);
      }
    },
  );

  it.each([[''], ['   '], [undefined], [null], [{}], [['owner@example.test']]])(
    '(j) rejects an empty or non-string email %p',
    async email => {
      expectTargetError(await issue(tokenFor('owner'), { email, purpose: 'support' }));
      expect(queries.filter(q => !q.sql.includes('member_permission'))).toHaveLength(0);
    },
  );

  it('(k) rejects a non-owner caller targeting an app owner', async () => {
    const response = await issue(tokenFor('helper', { role: 'general-member' }), {
      email: 'owner@example.test',
      purpose: 'support',
    });

    expectForbidden(response);
  });

  it('(k) allows a non-owner caller targeting a general member', async () => {
    const response = await issue(tokenFor('helper', { role: 'general-member' }), {
      email: 'Mixed.Case@Example.test',
      purpose: 'support',
    });

    expectIssued(response, 'helper', member('mixed'));
  });

  it('(k) allows an owner caller targeting another app owner', async () => {
    const response = await issue(tokenFor('owner'), { email: 'co-owner@example.test', purpose: 'support' });

    expectIssued(response, 'owner', member('co-owner'));
  });

  it('(k) uses the database role of the caller, not the role in the session', async () => {
    const response = await issue(tokenFor('helper', { role: 'app-owner' }), {
      email: 'owner@example.test',
      purpose: 'support',
    });

    expectForbidden(response);
  });

  it('still requires the permission in the session', async () => {
    const response = await issue(tokenFor('owner', { permissions: [] }), {
      email: 'Mixed.Case@Example.test',
      purpose: 'support',
    });

    expect(response.status).toBe(401);
    expectNothingIssued();
    expect(queries).toHaveLength(0);
  });

  it('requires a signed-in session', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v2/auth/password/temporary')
      .set('Host', 'first.example.test')
      .send({ email: 'Mixed.Case@Example.test', purpose: 'support' });

    expect(response.status).toBe(401);
    expectNothingIssued();
  });
});
