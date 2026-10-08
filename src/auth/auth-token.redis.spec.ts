/**
 * A2R: integration test against a real, throwaway Redis (never staging / production).
 * Runs only when REDIS_TEST_URI is set, e.g. REDIS_TEST_URI=redis://127.0.0.1:6379/15 — the database is flushed.
 * Without REDIS_TEST_URI the suite is skipped so CI is unaffected.
 * lodestar-app-backend src/helpers/authToken.redis.spec.ts consumes the same vector with its verify function.
 */
import Redis from 'ioredis';

import { AuthService } from './auth.service';
import { LoginStatus } from './auth.type';

const REDIS_TEST_URI = process.env.REDIS_TEST_URI;
const describeWithRedis = REDIS_TEST_URI ? describe : describe.skip;

// Shared fixed vector — identical in lodestar-app-backend src/helpers/authToken.spec.ts
const VECTOR = {
  token: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  memberId: '00000000-0000-4000-8000-000000000001',
  appId: 'p0-vector-app',
  key: 'auth:reset-password:app:00000000-0000-4000-8000-000000000001',
  value: '{"tokenHash":"a8ae6e6ee929abea3afcfc5258c8ccd6f85273e0d4626d26c7279f3250f77c8e","appId":"p0-vector-app"}',
  ttl: 3600,
};

describeWithRedis('reset-password issuance against a real Redis (A2R)', () => {
  let redis: Redis;

  beforeAll(() => {
    redis = new Redis(REDIS_TEST_URI as string);
  });
  afterAll(async () => {
    await redis.quit();
  });
  beforeEach(async () => {
    await redis.flushdb();
  });

  it('general-login I_RESET writes the shared vector key / value / ttl', async () => {
    const insertEmailJobIntoQueue = jest.fn(async () => undefined);
    const service = new AuthService(
      { log: jest.fn(), error: jest.fn() } as any,
      { getOrThrow: (key: string) => (key === 'NODE_ENV' ? 'test' : 'secret') } as any,
      { getFirstMatchedAppHost: jest.fn() } as any,
      {} as any,
      { insertEmailJobIntoQueue } as any,
      { getClient: () => redis } as any,
      {} as any,
      {} as any,
      {} as any,
      {
        getGeneralLoginMemberByUsernameOrEmail: jest.fn(async () => ({
          id: VECTOR.memberId,
          appId: VECTOR.appId,
          email: 'vector@example.com',
          passhash: null,
        })),
      } as any,
      {} as any,
    );
    service.resetPasswordTokenGenerator = () => VECTOR.token;

    const result = await service.generalLogin(
      {
        id: VECTOR.appId,
        host: 'vector.example.com',
        name: 'vector',
        orgId: null,
        settings: {},
        secrets: {},
        modules: [],
        defaultPermissions: [],
      },
      { appId: VECTOR.appId, account: 'vector@example.com', password: 'x', loggedInMembers: [] },
    );

    expect(result.status).toBe(LoginStatus.I_RESET_PASSWORD);
    expect(await redis.keys('auth:*')).toEqual([VECTOR.key]);
    expect(await redis.get(VECTOR.key)).toBe(VECTOR.value);
    const ttl = await redis.ttl(VECTOR.key);
    expect(ttl).toBeGreaterThan(VECTOR.ttl - 5);
    expect(ttl).toBeLessThanOrEqual(VECTOR.ttl);
    expect((insertEmailJobIntoQueue.mock.calls[0] as any[])[0].partials.url).toBe(
      `https://vector.example.com/reset-password?token=${VECTOR.token}&member=${VECTOR.memberId}`,
    );
  });
});
