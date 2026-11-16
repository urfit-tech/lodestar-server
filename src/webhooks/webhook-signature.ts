import { createHmac, timingSafeEqual } from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';

export type RequestWithRawBody = IncomingMessage & { rawBody?: Buffer; originalUrl?: string };

const WEBHOOK_PATH = /^\/api\/v\d+\/webhooks\//;

/**
 * `verify` option for the JSON body parser in main.ts: keeps the exact request bytes on `req.rawBody` for
 * /api/v<n>/webhooks/* only, so signatures can be checked against what the sender signed.
 */
export const keepRawBodyForWebhooks = (req: RequestWithRawBody, _res: ServerResponse, buf: Buffer): void => {
  const url = req.originalUrl || req.url || '';
  if (WEBHOOK_PATH.test(url)) {
    req.rawBody = buf;
  }
};

/**
 * Checks Meta's `X-Hub-Signature-256: sha256=<hex HMAC-SHA256 of the raw body with the app secret>`.
 * False when the secret, raw body or header is missing, so callers fail closed.
 */
export const isValidMetaSignature = (
  rawBody: Buffer | undefined,
  signatureHeader: string | undefined,
  appSecret: string | undefined,
): boolean => {
  if (!appSecret || !Buffer.isBuffer(rawBody) || typeof signatureHeader !== 'string') {
    return false;
  }
  const separator = signatureHeader.indexOf('=');
  const algorithm = signatureHeader.slice(0, separator);
  const signature = signatureHeader.slice(separator + 1).trim();
  if (separator < 0 || algorithm !== 'sha256' || !/^[0-9a-fA-F]{64}$/.test(signature)) {
    return false;
  }
  const expected = createHmac('sha256', appSecret).update(rawBody).digest();
  const given = Buffer.from(signature, 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
};
