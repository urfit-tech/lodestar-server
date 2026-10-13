import { createHash, randomBytes } from 'crypto';

/**
 * Single-use reset-password token for app members, stored hashed in Redis.
 *
 * lodestar-server only ISSUES these tokens (general-login I_RESET path); lodestar-app-backend
 * verifies and consumes them (src/helpers/authToken.ts). The keys, value JSON (field order included)
 * and TTL below must stay byte-identical to the backend's app reset-password format.
 *
 * - token     = 32 random bytes, lowercase hex (64 chars); only ever sent in the email link
 * - tokenHash = sha256(UTF-8 of the token string), lowercase hex; the only thing stored
 *
 * One key PER TOKEN plus a per-member index set, so every link a member received stays valid until its
 * own TTL ends (a member who tried to log in twice can open either mail); the backend revokes all of them
 * on a successful reset:
 *   auth:reset-password:app:<memberId>:<tokenHash>  -> {"tokenHash","appId"}  TTL 3600
 *   auth:reset-password:app-tokens:<memberId>       -> SET of tokenHash         TTL 3600 (refreshed on issue)
 *
 * Transitional: the legacy single key `auth:reset-password:app:<memberId>` (the format a backend without
 * per-token keys consumes) is still written and holds the newest token only. Drop it once
 * lodestar-app-backend runs the per-token format everywhere.
 */

export const RESET_PASSWORD_APP_KEY_PREFIX = 'auth:reset-password:app:';
export const RESET_PASSWORD_APP_INDEX_KEY_PREFIX = 'auth:reset-password:app-tokens:';
export const RESET_PASSWORD_APP_TTL_SECONDS = 3600;

/** Minimal surface of the ioredis client used here (ioredis Redis instances satisfy it). */
export interface ResetTokenRedis {
  set(key: string, value: string, expiryMode: 'EX', time: number): Promise<unknown>;
  sadd(key: string, ...members: string[]): Promise<unknown>;
  expire(key: string, seconds: number): Promise<unknown>;
}

export type TokenGenerator = () => string;

export const generateAuthToken: TokenGenerator = () => randomBytes(32).toString('hex');

export const hashAuthToken = (token: string) => createHash('sha256').update(token, 'utf8').digest('hex');

export const resetPasswordAppKey = (memberId: string) => `${RESET_PASSWORD_APP_KEY_PREFIX}${memberId}`;
export const resetPasswordAppTokenKey = (memberId: string, tokenHash: string) =>
  `${RESET_PASSWORD_APP_KEY_PREFIX}${memberId}:${tokenHash}`;
export const resetPasswordAppIndexKey = (memberId: string) => `${RESET_PASSWORD_APP_INDEX_KEY_PREFIX}${memberId}`;

// JSON key order is part of the cross-repo contract: tokenHash first.
export const serializeResetPasswordApp = (tokenHash: string, appId: string) => JSON.stringify({ tokenHash, appId });

export const issueResetPasswordAppToken = async (
  redis: ResetTokenRedis,
  { memberId, appId }: { memberId: string; appId: string },
  generate: TokenGenerator = generateAuthToken,
) => {
  const token = generate();
  const tokenHash = hashAuthToken(token);
  const value = serializeResetPasswordApp(tokenHash, appId);
  await redis.set(resetPasswordAppTokenKey(memberId, tokenHash), value, 'EX', RESET_PASSWORD_APP_TTL_SECONDS);
  await redis.sadd(resetPasswordAppIndexKey(memberId), tokenHash);
  await redis.expire(resetPasswordAppIndexKey(memberId), RESET_PASSWORD_APP_TTL_SECONDS);
  // transitional: a backend without per-token keys only reads the legacy single key
  await redis.set(resetPasswordAppKey(memberId), value, 'EX', RESET_PASSWORD_APP_TTL_SECONDS);
  return token;
};
