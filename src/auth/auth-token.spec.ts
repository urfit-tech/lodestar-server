import { randomBytes } from 'crypto';

import { AuthService } from './auth.service';
import { LoginStatus } from './auth.type';
import { generateAuthToken, hashAuthToken, issueResetPasswordAppToken, ResetTokenRedis } from './auth-token';
import { FakeRedis as SharedFakeRedis } from './testing/fake-redis';

// Shared fixed vector — identical in lodestar-app-backend src/helpers/authToken.spec.ts
const VECTOR = {
  token: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  memberId: '00000000-0000-4000-8000-000000000001',
  appId: 'p0-vector-app',
  tokenHash: 'a8ae6e6ee929abea3afcfc5258c8ccd6f85273e0d4626d26c7279f3250f77c8e',
  key: 'auth:reset-password:app:00000000-0000-4000-8000-000000000001',
  tokenKey:
    'auth:reset-password:app:00000000-0000-4000-8000-000000000001:a8ae6e6ee929abea3afcfc5258c8ccd6f85273e0d4626d26c7279f3250f77c8e',
  indexKey: 'auth:reset-password:app-tokens:00000000-0000-4000-8000-000000000001',
  value: '{"tokenHash":"a8ae6e6ee929abea3afcfc5258c8ccd6f85273e0d4626d26c7279f3250f77c8e","appId":"p0-vector-app"}',
  ttl: 3600,
};

class FakeRedis extends SharedFakeRedis implements ResetTokenRedis {
  entry(key: string) {
    const stored = this.store.get(key);
    return stored && { value: stored.value, ttl: stored.ttlSeconds };
  }
}

const buildAuthService = (opts: {
  redis: FakeRedis;
  member: Record<string, any>;
  appHosts?: Record<string, string>;
  insertEmailJobIntoQueue: jest.Mock;
  getFirstMatchedAppHost: jest.Mock;
}) => {
  const configService = { getOrThrow: (key: string) => (key === 'NODE_ENV' ? 'test' : 'secret') };
  const appService = { getFirstMatchedAppHost: opts.getFirstMatchedAppHost };
  const mailService = { insertEmailJobIntoQueue: opts.insertEmailJobIntoQueue };
  const cacheService = { getClient: () => opts.redis };
  const memberInfra = { getGeneralLoginMemberByUsernameOrEmail: jest.fn(async () => opts.member) };
  return new AuthService(
    { log: jest.fn(), error: jest.fn() } as any,
    configService as any,
    appService as any,
    {} as any,
    mailService as any,
    cacheService as any,
    {} as any,
    {} as any,
    {} as any,
    memberInfra as any,
    {} as any,
  );
};

const appCacheOf = (id: string, host: string) =>
  ({
    id,
    host,
    name: `${id} name`,
    orgId: null,
    settings: {},
    secrets: {},
    modules: [],
    defaultPermissions: [],
  } as any);

describe('reset-password token issuance (lodestar-server)', () => {
  let redis: FakeRedis;
  let insertEmailJobIntoQueue: jest.Mock;
  let getFirstMatchedAppHost: jest.Mock;

  beforeEach(() => {
    redis = new FakeRedis();
    insertEmailJobIntoQueue = jest.fn(async () => undefined);
    getFirstMatchedAppHost = jest.fn(async (appId: string) => ({ appId, host: `${appId}.primary.example.com` }));
  });

  it('hashes the fixed vector token as sha256 of its utf-8 string in lowercase hex', () => {
    expect(hashAuthToken(VECTOR.token)).toBe(VECTOR.tokenHash);
  });

  it('writes the exact shared vector keys (per-token, index, legacy), value and ttl', async () => {
    const token = await issueResetPasswordAppToken(
      redis,
      { memberId: VECTOR.memberId, appId: VECTOR.appId },
      () => VECTOR.token,
    );
    expect(token).toBe(VECTOR.token);
    expect(redis.keys()).toEqual([VECTOR.indexKey, VECTOR.key, VECTOR.tokenKey]);
    expect(redis.entry(VECTOR.tokenKey)).toEqual({ value: VECTOR.value, ttl: VECTOR.ttl });
    expect(redis.entry(VECTOR.key)).toEqual({ value: VECTOR.value, ttl: VECTOR.ttl });
    expect(await redis.smembers(VECTOR.indexKey)).toEqual([VECTOR.tokenHash]);
    expect(redis.ttl(VECTOR.indexKey)).toBe(VECTOR.ttl);
  });

  it('a second issue keeps the first token key and adds the new one; the legacy key holds the newest', async () => {
    // fixed tokens so the expectations hash literals, not the issued values
    const FIRST = 'a'.repeat(64);
    const SECOND = 'b'.repeat(64);
    await issueResetPasswordAppToken(redis, { memberId: VECTOR.memberId, appId: VECTOR.appId }, () => FIRST);
    await issueResetPasswordAppToken(redis, { memberId: VECTOR.memberId, appId: VECTOR.appId }, () => SECOND);
    for (const token of [FIRST, SECOND]) {
      expect(redis.entry(`${VECTOR.key}:${hashAuthToken(token)}`)?.value).toBe(
        JSON.stringify({ tokenHash: hashAuthToken(token), appId: VECTOR.appId }),
      );
    }
    expect((await redis.smembers(VECTOR.indexKey)).sort()).toEqual(
      [hashAuthToken(FIRST), hashAuthToken(SECOND)].sort(),
    );
    expect(redis.entry(VECTOR.key)?.value).toBe(
      JSON.stringify({ tokenHash: hashAuthToken(SECOND), appId: VECTOR.appId }),
    );
  });

  it('generates 64-char lowercase hex tokens that differ per call', () => {
    const a = generateAuthToken();
    const b = generateAuthToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(b).not.toBe(a);
    expect(randomBytes(32).toString('hex')).toHaveLength(a.length);
  });

  it('general-login I_RESET path: stores the vector and mails the original token, host of the same app', async () => {
    const service = buildAuthService({
      redis,
      member: { id: VECTOR.memberId, appId: VECTOR.appId, email: 'm@example.com', passhash: null },
      insertEmailJobIntoQueue,
      getFirstMatchedAppHost,
    });
    service.resetPasswordTokenGenerator = () => VECTOR.token;
    const result = await service.generalLogin(appCacheOf(VECTOR.appId, 'alias.vector.example.com'), {
      appId: VECTOR.appId,
      account: 'm@example.com',
      password: 'whatever',
      loggedInMembers: [],
    });
    expect(result.status).toBe(LoginStatus.I_RESET_PASSWORD);
    expect(redis.entry(VECTOR.tokenKey)).toEqual({ value: VECTOR.value, ttl: VECTOR.ttl });
    expect(redis.entry(VECTOR.key)).toEqual({ value: VECTOR.value, ttl: VECTOR.ttl });
    const { partials } = insertEmailJobIntoQueue.mock.calls[0][0];
    expect(partials.url).toBe(
      `https://alias.vector.example.com/reset-password?token=${VECTOR.token}&member=${VECTOR.memberId}`,
    );
    expect(getFirstMatchedAppHost).not.toHaveBeenCalled();
  });

  it('general-login I_RESET path: request host of another app -> target app primary host', async () => {
    const service = buildAuthService({
      redis,
      member: { id: VECTOR.memberId, appId: 'app-b', email: 'm@example.com', passhash: null },
      insertEmailJobIntoQueue,
      getFirstMatchedAppHost,
    });
    await service.generalLogin(appCacheOf('app-a', 'a.example.com'), {
      appId: 'app-b',
      account: 'm@example.com',
      password: 'whatever',
      loggedInMembers: [],
    });
    expect(getFirstMatchedAppHost).toHaveBeenCalledWith('app-b', expect.anything());
    const url = new URL(insertEmailJobIntoQueue.mock.calls[0][0].partials.url);
    expect(url.host).toBe('app-b.primary.example.com');
    const token = url.searchParams.get('token') as string;
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(redis.entry(VECTOR.key)?.value).toBe(JSON.stringify({ tokenHash: hashAuthToken(token), appId: 'app-b' }));
  });

  it('general-login I_RESET path: no host for the target app -> no mail, no token', async () => {
    getFirstMatchedAppHost.mockResolvedValue(null);
    const service = buildAuthService({
      redis,
      member: { id: VECTOR.memberId, appId: 'app-b', email: 'm@example.com', passhash: null },
      insertEmailJobIntoQueue,
      getFirstMatchedAppHost,
    });
    await expect(
      service.generalLogin(appCacheOf('app-a', 'a.example.com'), {
        appId: 'app-b',
        account: 'm@example.com',
        password: 'whatever',
        loggedInMembers: [],
      }),
    ).rejects.toMatchObject({ code: 'E_NO_APP_HOST' });
    expect(insertEmailJobIntoQueue).not.toHaveBeenCalled();
    expect(redis.keys('auth:reset-password:')).toEqual([]);
    expect(redis.keys('auth:issue-')).toEqual([]);
  });
});
