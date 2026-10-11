import { readFileSync } from 'fs';
import { join } from 'path';
import {
  allowDeviceBindSend,
  allowTokenIssue,
  authKeys,
  clearLoginAttempts,
  fingerprintHash,
  INCR_WITH_TTL_SCRIPT,
  isDeviceBindLocked,
  LIMITS,
  matchDeviceLoginChallenge,
  normalizeIdentifier,
  readDeviceBindChallenge,
  registerLoginAttempt,
  safeEqual,
  TOO_MANY_ATTEMPTS_BODY,
  TOO_MANY_ATTEMPTS_STATUS,
  writeDeviceBindChallenge,
  writeDeviceLoginChallenge,
} from './auth-limits';
import { FakeRedis } from './testing/fake-redis';

// identical copy in lodestar-app-backend; both services are tested against it
const fixture = JSON.parse(readFileSync(join(__dirname, 'auth-limits.fixture.json'), 'utf8'));

const APP_ID = 'sample-app';
const MEMBER_ID = '00000000-0000-4000-8000-0000000000aa';
const EMAIL = '  Member@Example.COM ';
const FINGERPRINT = 'sample-fingerprint';
const IP = '203.0.113.7';

/** Fills a fixture template such as "auth:device-bind:<appId>:<norm(email)>". */
const fill = (template: string, values: Record<string, string>) =>
  template.replace(/<([^>]+)>/g, (match, name) => {
    if (!(name in values)) throw new Error(`no value for ${match}`);
    return values[name];
  });

const values = {
  appId: APP_ID,
  memberId: MEMBER_ID,
  'norm(email)': normalizeIdentifier(EMAIL),
  'norm(account)': normalizeIdentifier(EMAIL),
  ip: IP,
  'app|org': 'app',
  'appId|orgId': APP_ID,
  fpHash: fingerprintHash(FINGERPRINT),
};

describe('shared auth limit keys (auth-limits.fixture.json)', () => {
  it('normalizes identifiers like the fixture', () => {
    expect(normalizeIdentifier(fixture.normalize.input)).toBe(fixture.normalize.norm);
  });

  it('builds every key exactly like the fixture templates', () => {
    const { keys } = fixture;
    expect(authKeys.deviceLoginLimit(APP_ID, MEMBER_ID)).toBe(fill(keys.deviceLoginLimit.key, values));
    expect(authKeys.deviceBind(APP_ID, EMAIL)).toBe(fill(keys.deviceBind.key, values));
    expect(authKeys.deviceBindFail(APP_ID, MEMBER_ID)).toBe(fill(keys.deviceBindFail.key, values));
    expect(authKeys.deviceBindSendCooldown(APP_ID, MEMBER_ID)).toBe(fill(keys.deviceBindSendCooldown.key, values));
    expect(authKeys.deviceBindSendCount(APP_ID, MEMBER_ID)).toBe(fill(keys.deviceBindSendCount.key, values));
    expect(authKeys.loginFailAccountIp('app', APP_ID, EMAIL, IP)).toBe(fill(keys.loginFailAccountIp.key, values));
    expect(authKeys.loginFailAccount('app', APP_ID, EMAIL)).toBe(fill(keys.loginFailAccount.key, values));
    expect(authKeys.loginFailIp(IP)).toBe(fill(keys.loginFailIp.key, values));
    for (const kind of keys.issueCooldown.kinds) {
      expect(authKeys.issueCooldown(kind as any, MEMBER_ID)).toBe(fill(keys.issueCooldown.key, { ...values, kind }));
      expect(authKeys.issueCount(kind as any, MEMBER_ID)).toBe(fill(keys.issueCount.key, { ...values, kind }));
    }
  });

  it('uses the fixture TTLs and caps', () => {
    const { keys } = fixture;
    for (const name of Object.keys(LIMITS) as Array<keyof typeof LIMITS>) {
      const spec = keys[name] as { ttlSeconds: number; cap?: number };
      expect({ name, ...LIMITS[name] }).toEqual({
        name,
        ttlSeconds: spec.ttlSeconds,
        ...(spec.cap ? { cap: spec.cap } : {}),
      });
    }
  });

  it('answers over-limit attempts with the fixture status and body', () => {
    expect(TOO_MANY_ATTEMPTS_STATUS).toBe(fixture.tooManyAttemptsResponse.httpStatus);
    expect(TOO_MANY_ATTEMPTS_BODY).toEqual(fixture.tooManyAttemptsResponse.body);
  });

  it('increments counters and sets the TTL only on creation', () => {
    expect(INCR_WITH_TTL_SCRIPT).toContain("redis.call('INCR', key)");
    expect(INCR_WITH_TTL_SCRIPT).toContain("if n == 1 then redis.call('EXPIRE', key, ARGV[i]) end");
  });

  it('writes the device login challenge in the fixture format and TTL', async () => {
    const redis = new FakeRedis();
    await writeDeviceLoginChallenge(redis, APP_ID, MEMBER_ID, FINGERPRINT);
    const key = fill(fixture.keys.deviceLoginLimit.key, values);
    expect(redis.keys('auth:')).toEqual([key]);
    expect(await redis.get(key)).toBe(fill(fixture.keys.deviceLoginLimit.value, values));
    expect(redis.ttl(key)).toBe(fixture.keys.deviceLoginLimit.ttlSeconds);
  });

  it('accepts a device login challenge written by the other service in the fixture format', async () => {
    const redis = new FakeRedis();
    await redis.set(
      fill(fixture.keys.deviceLoginLimit.key, values),
      fill(fixture.keys.deviceLoginLimit.value, values),
      'EX',
      fixture.keys.deviceLoginLimit.ttlSeconds,
    );
    expect(await matchDeviceLoginChallenge(redis, APP_ID, MEMBER_ID, FINGERPRINT)).toBe(true);
    expect(await matchDeviceLoginChallenge(redis, APP_ID, MEMBER_ID, 'other-fingerprint')).toBe(false);
    expect(await matchDeviceLoginChallenge(redis, APP_ID, 'other-member', FINGERPRINT)).toBe(false);
    expect(await matchDeviceLoginChallenge(redis, APP_ID, MEMBER_ID, undefined)).toBe(false);
  });

  it('writes and reads the device bind challenge in the fixture format and TTL', async () => {
    const redis = new FakeRedis();
    await writeDeviceBindChallenge(redis, APP_ID, EMAIL, MEMBER_ID);
    const key = fill(fixture.keys.deviceBind.key, values);
    expect(redis.keys('auth:')).toEqual([key]);
    expect(await redis.get(key)).toBe(fill(fixture.keys.deviceBind.value, values));
    expect(redis.ttl(key)).toBe(fixture.keys.deviceBind.ttlSeconds);

    const other = new FakeRedis();
    await other.set(key, fill(fixture.keys.deviceBind.value, values), 'EX', fixture.keys.deviceBind.ttlSeconds);
    expect(await readDeviceBindChallenge(other, APP_ID, 'member@example.com')).toBe(MEMBER_ID);
    expect(await readDeviceBindChallenge(other, APP_ID, 'someone@example.com')).toBeNull();
    expect(await readDeviceBindChallenge(other, APP_ID, '')).toBeNull();
  });

  it('treats the device bind failure counter as locked at the fixture cap', async () => {
    const redis = new FakeRedis();
    const key = fill(fixture.keys.deviceBindFail.key, values);
    await redis.set(key, String(fixture.keys.deviceBindFail.cap - 1));
    expect(await isDeviceBindLocked(redis, APP_ID, MEMBER_ID)).toBe(false);
    await redis.set(key, String(fixture.keys.deviceBindFail.cap));
    expect(await isDeviceBindLocked(redis, APP_ID, MEMBER_ID)).toBe(true);
  });

  it('allows device bind mails once per cooldown and up to the hourly cap', async () => {
    const redis = new FakeRedis();
    const cooldownKey = fill(fixture.keys.deviceBindSendCooldown.key, values);
    const countKey = fill(fixture.keys.deviceBindSendCount.key, values);
    expect(await allowDeviceBindSend(redis, APP_ID, MEMBER_ID)).toBe(true);
    expect(await redis.get(cooldownKey)).toBe(fixture.keys.deviceBindSendCooldown.value);
    expect(redis.ttl(cooldownKey)).toBe(fixture.keys.deviceBindSendCooldown.ttlSeconds);
    expect(redis.ttl(countKey)).toBe(fixture.keys.deviceBindSendCount.ttlSeconds);
    expect(await allowDeviceBindSend(redis, APP_ID, MEMBER_ID)).toBe(false);

    const results: boolean[] = [];
    for (let i = 0; i < fixture.keys.deviceBindSendCount.cap + 1; i++) {
      await redis.del(cooldownKey);
      results.push(await allowDeviceBindSend(redis, APP_ID, MEMBER_ID));
    }
    // one send already happened above
    expect(results.filter(Boolean)).toHaveLength(fixture.keys.deviceBindSendCount.cap - 1);
  });

  it('allows token issuance once per cooldown and up to the hourly cap per kind', async () => {
    const redis = new FakeRedis();
    for (const kind of fixture.keys.issueCooldown.kinds) {
      const kindValues = { ...values, kind };
      const cooldownKey = fill(fixture.keys.issueCooldown.key, kindValues);
      const countKey = fill(fixture.keys.issueCount.key, kindValues);
      expect(await allowTokenIssue(redis, kind as any, MEMBER_ID)).toBe(true);
      expect(redis.ttl(cooldownKey)).toBe(fixture.keys.issueCooldown.ttlSeconds);
      expect(redis.ttl(countKey)).toBe(fixture.keys.issueCount.ttlSeconds);
      expect(await allowTokenIssue(redis, kind as any, MEMBER_ID)).toBe(false);
      const results: boolean[] = [];
      for (let i = 0; i < fixture.keys.issueCount.cap; i++) {
        await redis.del(cooldownKey);
        results.push(await allowTokenIssue(redis, kind as any, MEMBER_ID));
      }
      expect(results.filter(Boolean)).toHaveLength(fixture.keys.issueCount.cap - 1);
    }
  });

  it('counts login attempts on all three keys with the fixture TTLs and caps', async () => {
    const redis = new FakeRedis();
    const accountIpKey = fill(fixture.keys.loginFailAccountIp.key, values);
    const accountKey = fill(fixture.keys.loginFailAccount.key, values);
    const ipKey = fill(fixture.keys.loginFailIp.key, values);

    const outcomes: boolean[] = [];
    for (let i = 0; i < fixture.keys.loginFailAccountIp.cap + 1; i++) {
      outcomes.push(await registerLoginAttempt(redis, 'app', APP_ID, EMAIL, IP));
    }
    expect(outcomes.filter(Boolean)).toHaveLength(fixture.keys.loginFailAccountIp.cap);
    expect(outcomes[outcomes.length - 1]).toBe(false);
    expect(redis.ttl(accountIpKey)).toBe(fixture.keys.loginFailAccountIp.ttlSeconds);
    expect(redis.ttl(accountKey)).toBe(fixture.keys.loginFailAccount.ttlSeconds);
    expect(redis.ttl(ipKey)).toBe(fixture.keys.loginFailIp.ttlSeconds);

    await clearLoginAttempts(redis, 'app', APP_ID, EMAIL, IP);
    expect(redis.keys('auth:')).toEqual([ipKey]);
  });

  it('rejects once the account or ip counters pass their caps', async () => {
    const redis = new FakeRedis();
    await redis.set(fill(fixture.keys.loginFailAccount.key, values), String(fixture.keys.loginFailAccount.cap));
    expect(await registerLoginAttempt(redis, 'app', APP_ID, EMAIL, IP)).toBe(false);

    const other = new FakeRedis();
    await other.set(fill(fixture.keys.loginFailIp.key, values), String(fixture.keys.loginFailIp.cap));
    expect(await registerLoginAttempt(other, 'app', APP_ID, EMAIL, IP)).toBe(false);
  });

  it('compares strings in constant time', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(safeEqual(null, 'abc')).toBe(false);
    expect(safeEqual(undefined, undefined)).toBe(false);
  });
});
