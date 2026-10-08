import { createHash, randomBytes } from 'crypto';

/**
 * Single-use reset-password token for app members, stored hashed in Redis (one key per member).
 *
 * lodestar-server only ISSUES these tokens (general-login I_RESET path); lodestar-app-backend
 * verifies and consumes them (src/helpers/authToken.ts). The key, value JSON (field order included)
 * and TTL below must stay byte-identical to the backend's app reset-password format.
 *
 * - token     = 32 random bytes, lowercase hex (64 chars); only ever sent in the email link
 * - tokenHash = sha256(UTF-8 of the token string), lowercase hex; the only thing stored
 */

export const RESET_PASSWORD_APP_KEY_PREFIX = 'auth:reset-password:app:';
export const RESET_PASSWORD_APP_TTL_SECONDS = 3600;

/** Minimal surface of the ioredis client used here (ioredis Redis instances satisfy it). */
export interface ResetTokenRedis {
  set(key: string, value: string, expiryMode: 'EX', time: number): Promise<unknown>;
}

export type TokenGenerator = () => string;

export const generateAuthToken: TokenGenerator = () => randomBytes(32).toString('hex');

export const hashAuthToken = (token: string) => createHash('sha256').update(token, 'utf8').digest('hex');

export const resetPasswordAppKey = (memberId: string) => `${RESET_PASSWORD_APP_KEY_PREFIX}${memberId}`;

// JSON key order is part of the cross-repo contract: tokenHash first.
export const serializeResetPasswordApp = (tokenHash: string, appId: string) => JSON.stringify({ tokenHash, appId });

export const issueResetPasswordAppToken = async (
  redis: ResetTokenRedis,
  { memberId, appId }: { memberId: string; appId: string },
  generate: TokenGenerator = generateAuthToken,
) => {
  const token = generate();
  await redis.set(
    resetPasswordAppKey(memberId),
    serializeResetPasswordApp(hashAuthToken(token), appId),
    'EX',
    RESET_PASSWORD_APP_TTL_SECONDS,
  );
  return token;
};
