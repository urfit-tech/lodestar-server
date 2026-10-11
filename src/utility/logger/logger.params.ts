import { Params } from 'nestjs-pino';

/** Request headers that are written to the request log; every other header is left out. */
export const LOGGED_REQUEST_HEADERS = [
  'host',
  'user-agent',
  'referer',
  'x-forwarded-for',
  'x-amzn-trace-id',
  'content-type',
  'content-length',
  'origin',
];

const REDACTED = '[redacted]';
const SENSITIVE_QUERY_NAME = /token|code|key|secret|password|signature/i;

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
};

/** Replaces the values of query parameters whose names look like credentials. */
export const redactUrl = (url: unknown): unknown => {
  if (typeof url !== 'string') {
    return url;
  }
  const queryStart = url.indexOf('?');
  if (queryStart < 0) {
    return url;
  }
  const hashStart = url.indexOf('#', queryStart);
  const query = url.slice(queryStart + 1, hashStart < 0 ? undefined : hashStart);
  const redacted = query
    .split('&')
    .map(part => {
      const separator = part.indexOf('=');
      const name = separator < 0 ? part : part.slice(0, separator);
      return separator >= 0 && SENSITIVE_QUERY_NAME.test(safeDecode(name)) ? `${name}=${REDACTED}` : part;
    })
    .join('&');
  return `${url.slice(0, queryStart)}?${redacted}`;
};

export const serializeRequest = (req: any) => {
  if (!req || typeof req !== 'object') {
    return req;
  }
  const source = req.headers || {};
  const headers: Record<string, unknown> = {};
  for (const name of LOGGED_REQUEST_HEADERS) {
    if (source[name] !== undefined) {
      headers[name] = source[name];
    }
  }
  return {
    id: req.id,
    method: req.method,
    url: redactUrl(req.url),
    remoteAddress: req.remoteAddress,
    headers,
  };
};

export const serializeResponse = (res: any) => {
  if (!res || typeof res !== 'object') {
    return res;
  }
  return { statusCode: res.statusCode };
};

/** Keeps only the error type, message and stack (request configs and responses of HTTP client errors are left out). */
export const serializeError = (err: any) => {
  if (!err || typeof err !== 'object') {
    return err;
  }
  return { type: err.type, message: err.message, stack: err.stack };
};

export const LOGGER_REDACT_PATHS = ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'];

export const buildPinoHttpOptions = () => ({
  serializers: {
    req: serializeRequest,
    res: serializeResponse,
    err: serializeError,
  },
  redact: LOGGER_REDACT_PATHS,
});

/** nestjs-pino parameters shared by the API, runner and tasker processes. */
export const buildLoggerParams = (nodeEnv: string): Params => {
  const base = buildPinoHttpOptions();
  return ['production', 'staging'].includes(nodeEnv)
    ? { pinoHttp: base }
    : {
        pinoHttp: {
          ...base,
          transport: {
            target: 'pino-pretty',
            options: {
              ignore: 'pid,context,hostname',
            },
          },
        },
      };
};
