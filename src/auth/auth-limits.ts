import { createHash, timingSafeEqual } from 'crypto';

/**
 * Shared Redis keys for login limits and device-flow challenges.
 *
 * lodestar-app-backend implements the same key names, values and TTLs; both repositories keep an identical copy of
 * auth-limits.fixture.json and test against it, so a key written by one service is accepted by the other.
 */

export const LIMITS = {
  deviceLoginLimit: { ttlSeconds: 600 },
  deviceBind: { ttlSeconds: 1800 },
  deviceBindFail: { ttlSeconds: 3600, cap: 10 },
  deviceBindSendCooldown: { ttlSeconds: 60 },
  deviceBindSendCount: { ttlSeconds: 3600, cap: 5 },
  loginFailAccountIp: { ttlSeconds: 900, cap: 10 },
  loginFailAccount: { ttlSeconds: 900, cap: 50 },
  loginFailIp: { ttlSeconds: 900, cap: 200 },
  issueCooldown: { ttlSeconds: 60 },
  issueCount: { ttlSeconds: 3600, cap: 5 },
} as const;

export type LoginScope = 'app' | 'org';
export type IssueKind = 'reset-password:app' | 'reset-password:org' | 'verify-email';

export const TOO_MANY_ATTEMPTS_STATUS = 429;
export const TOO_MANY_ATTEMPTS_BODY = {
  code: 'E_TOO_MANY_ATTEMPTS',
  message: '嘗試次數過多，請稍後再試',
  result: null,
};

const sha256Hex = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');

/** norm(x): lowercase hex sha256 of x.trim().toLowerCase(). */
export const normalizeIdentifier = (value: string) =>
  sha256Hex(
    String(value ?? '')
      .trim()
      .toLowerCase(),
  );

/** fpHash(x): lowercase hex sha256 of the computed fingerprint id. */
export const fingerprintHash = (fingerPrintId: string) => sha256Hex(String(fingerPrintId));

/** Constant-time comparison of two strings of any length. */
export const safeEqual = (a: string | null | undefined, b: string | null | undefined) => {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const left = createHash('sha256').update(a, 'utf8').digest();
  const right = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(left, right) && a.length === b.length;
};

export const authKeys = {
  deviceLoginLimit: (appId: string, memberId: string) => `auth:device-login-limit:${appId}:${memberId}`,
  deviceBind: (appId: string, email: string) => `auth:device-bind:${appId}:${normalizeIdentifier(email)}`,
  deviceBindFail: (appId: string, memberId: string) => `auth:device-bind-fail:${appId}:${memberId}`,
  deviceBindSendCooldown: (appId: string, memberId: string) => `auth:device-bind-send-cooldown:${appId}:${memberId}`,
  deviceBindSendCount: (appId: string, memberId: string) => `auth:device-bind-send-count:${appId}:${memberId}`,
  loginFailAccountIp: (scope: LoginScope, id: string, account: string, ip: string) =>
    `auth:login-fail:${scope}:${id}:${normalizeIdentifier(account)}:${ip}`,
  loginFailAccount: (scope: LoginScope, id: string, account: string) =>
    `auth:login-fail:${scope}:${id}:${normalizeIdentifier(account)}`,
  loginFailIp: (ip: string) => `auth:login-fail:ip:${ip}`,
  issueCooldown: (kind: IssueKind, memberId: string) => `auth:issue-cooldown:${kind}:${memberId}`,
  issueCount: (kind: IssueKind, memberId: string) => `auth:issue-count:${kind}:${memberId}`,
};

/** Increments every key in KEYS; the TTL in ARGV[i] is set only when KEYS[i] is created. Returns the new values. */
export const INCR_WITH_TTL_SCRIPT = `local r = {}
for i, key in ipairs(KEYS) do
  local n = redis.call('INCR', key)
  if n == 1 then redis.call('EXPIRE', key, ARGV[i]) end
  r[i] = n
end
return r`;

/** Decrements an existing counter; never creates a key (so it can never leave a counter without a TTL). */
export const DECR_IF_EXISTS_SCRIPT = `if redis.call('EXISTS', KEYS[1]) == 1 then return redis.call('DECR', KEYS[1]) end
return 0`;

/** Minimal surface of the ioredis client used by these helpers (ioredis Redis instances satisfy it). */
export interface LimitRedis {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, secondsToken: 'EX', seconds: number): Promise<unknown>;
  set(key: string, value: string, secondsToken: 'EX', seconds: number, nx: 'NX'): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  eval(script: string, numKeys: number, ...args: Array<string | number>): Promise<unknown>;
}

export const incrementWithTtl = async (
  redis: LimitRedis,
  entries: Array<{ key: string; ttlSeconds: number }>,
): Promise<number[]> => {
  const result = (await redis.eval(
    INCR_WITH_TTL_SCRIPT,
    entries.length,
    ...entries.map(({ key }) => key),
    ...entries.map(({ ttlSeconds }) => ttlSeconds),
  )) as Array<number | string>;
  return result.map(Number);
};

export const decrementIfExists = async (redis: LimitRedis, key: string): Promise<number> =>
  Number(await redis.eval(DECR_IF_EXISTS_SCRIPT, 1, key));

/** SET NX EX; resolves true when the key was created. */
export const acquireCooldown = async (redis: LimitRedis, key: string, ttlSeconds: number): Promise<boolean> =>
  (await redis.set(key, '1', 'EX', ttlSeconds, 'NX')) === 'OK';

export const readCounter = async (redis: LimitRedis, key: string): Promise<number> => Number(await redis.get(key)) || 0;

const parseJson = (raw: string | null): Record<string, unknown> | null => {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

// ----- device login limit challenge -----

export const writeDeviceLoginChallenge = (redis: LimitRedis, appId: string, memberId: string, fingerPrintId: string) =>
  redis.set(
    authKeys.deviceLoginLimit(appId, memberId),
    JSON.stringify({ fp: fingerprintHash(fingerPrintId) }),
    'EX',
    LIMITS.deviceLoginLimit.ttlSeconds,
  );

export const matchDeviceLoginChallenge = async (
  redis: LimitRedis,
  appId: string,
  memberId: string,
  fingerPrintId: string | undefined,
): Promise<boolean> => {
  if (!appId || !memberId || !fingerPrintId) {
    return false;
  }
  const value = parseJson(await redis.get(authKeys.deviceLoginLimit(appId, memberId)));
  return typeof value?.fp === 'string' && safeEqual(value.fp, fingerprintHash(fingerPrintId));
};

export const clearDeviceLoginChallenge = (redis: LimitRedis, appId: string, memberId: string) =>
  redis.del(authKeys.deviceLoginLimit(appId, memberId));

// ----- device bind challenge -----

export const isDeviceBindLocked = async (redis: LimitRedis, appId: string, memberId: string) =>
  (await readCounter(redis, authKeys.deviceBindFail(appId, memberId))) >= LIMITS.deviceBindFail.cap;

export const writeDeviceBindChallenge = (redis: LimitRedis, appId: string, email: string, memberId: string) =>
  redis.set(authKeys.deviceBind(appId, email), JSON.stringify({ memberId }), 'EX', LIMITS.deviceBind.ttlSeconds);

/** Returns the member id stored in the device bind challenge for this email, or null. */
export const readDeviceBindChallenge = async (redis: LimitRedis, appId: string, email: string) => {
  if (!appId || !email) {
    return null;
  }
  const value = parseJson(await redis.get(authKeys.deviceBind(appId, email)));
  return typeof value?.memberId === 'string' && value.memberId ? value.memberId : null;
};

export const clearDeviceBindChallenge = (redis: LimitRedis, appId: string, email: string) =>
  redis.del(authKeys.deviceBind(appId, email));

/** Cooldown (SET NX) first, then the hourly counter; a send is allowed only when both pass. */
export const allowDeviceBindSend = async (redis: LimitRedis, appId: string, memberId: string) => {
  const cooled = await acquireCooldown(
    redis,
    authKeys.deviceBindSendCooldown(appId, memberId),
    LIMITS.deviceBindSendCooldown.ttlSeconds,
  );
  if (!cooled) {
    return false;
  }
  const [count] = await incrementWithTtl(redis, [
    { key: authKeys.deviceBindSendCount(appId, memberId), ttlSeconds: LIMITS.deviceBindSendCount.ttlSeconds },
  ]);
  return count <= LIMITS.deviceBindSendCount.cap;
};

// ----- token issuance -----

/** Cooldown (SET NX) first, then the hourly counter; a token may be issued only when both pass. */
export const allowTokenIssue = async (redis: LimitRedis, kind: IssueKind, memberId: string) => {
  const cooled = await acquireCooldown(redis, authKeys.issueCooldown(kind, memberId), LIMITS.issueCooldown.ttlSeconds);
  if (!cooled) {
    return false;
  }
  const [count] = await incrementWithTtl(redis, [
    { key: authKeys.issueCount(kind, memberId), ttlSeconds: LIMITS.issueCount.ttlSeconds },
  ]);
  return count <= LIMITS.issueCount.cap;
};

// ----- login attempts -----

/**
 * Counts one login attempt on the account+ip, account and ip counters before the password is checked.
 * Returns false when any counter is over its cap; the caller must then reject without checking the password.
 */
export const registerLoginAttempt = async (
  redis: LimitRedis,
  scope: LoginScope,
  id: string,
  account: string,
  ip: string,
) => {
  const [accountIp, accountOnly, ipOnly] = await incrementWithTtl(redis, [
    { key: authKeys.loginFailAccountIp(scope, id, account, ip), ttlSeconds: LIMITS.loginFailAccountIp.ttlSeconds },
    { key: authKeys.loginFailAccount(scope, id, account), ttlSeconds: LIMITS.loginFailAccount.ttlSeconds },
    { key: authKeys.loginFailIp(ip), ttlSeconds: LIMITS.loginFailIp.ttlSeconds },
  ]);
  return (
    accountIp <= LIMITS.loginFailAccountIp.cap &&
    accountOnly <= LIMITS.loginFailAccount.cap &&
    ipOnly <= LIMITS.loginFailIp.cap
  );
};

/** After a successful login the account+ip and account counters are removed; the ip counter is kept. */
export const clearLoginAttempts = (redis: LimitRedis, scope: LoginScope, id: string, account: string, ip: string) =>
  redis.del(authKeys.loginFailAccountIp(scope, id, account, ip), authKeys.loginFailAccount(scope, id, account));
