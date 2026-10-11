import { Writable } from 'stream';
import express from 'express';
import pinoHttp from 'pino-http';
import request from 'supertest';

import { buildLoggerParams, buildPinoHttpOptions, redactUrl, serializeError } from './logger.params';

const CANARY = {
  authorization: 'Bearer canary-authorization-value',
  cookie: 'connect.sid=canary-cookie-value',
  setCookie: 'connect.sid=canary-set-cookie-value; Path=/',
  queryToken: 'canary-query-token',
  queryCode: 'canary-query-code',
  axiosHeader: 'Bearer canary-axios-header',
  axiosBody: 'canary-axios-body',
  apiKey: 'canary-api-key',
};

const capture = () => {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  return { lines, stream };
};

describe('request log serializers', () => {
  it('uses the same serializers and redaction in production and staging, without a transport', () => {
    for (const nodeEnv of ['production', 'staging']) {
      const params = buildLoggerParams(nodeEnv) as any;
      expect(params.pinoHttp.transport).toBeUndefined();
      expect(params.pinoHttp.serializers).toEqual(buildPinoHttpOptions().serializers);
      expect(params.pinoHttp.redact).toEqual([
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
      ]);
    }
    expect((buildLoggerParams('development') as any).pinoHttp.serializers).toEqual(buildPinoHttpOptions().serializers);
  });

  it('never writes credentials from requests, responses or HTTP client errors', async () => {
    const { lines, stream } = capture();
    const httpLogger = pinoHttp(buildPinoHttpOptions() as any, stream);
    const app = express();
    app.use(httpLogger);
    app.get('/api/v2/sample', (req, res) => {
      const axiosLikeError: any = new Error('Request failed with status code 401');
      axiosLikeError.isAxiosError = true;
      axiosLikeError.config = {
        url: 'https://upstream.example.test/token',
        headers: { Authorization: CANARY.axiosHeader, 'x-api-key': CANARY.apiKey },
        data: JSON.stringify({ secret: CANARY.axiosBody }),
      };
      axiosLikeError.request = { _header: `GET / HTTP/1.1\r\nAuthorization: ${CANARY.axiosHeader}\r\n` };
      axiosLikeError.response = { status: 401, headers: { 'set-cookie': CANARY.setCookie }, data: CANARY.axiosBody };
      req.log.error({ err: axiosLikeError }, 'upstream call failed');
      httpLogger.logger.error(axiosLikeError);
      res.setHeader('Set-Cookie', CANARY.setCookie);
      res.status(200).json({ ok: true });
    });

    await request(app)
      .get(`/api/v2/sample?token=${CANARY.queryToken}&code=${CANARY.queryCode}&api_key=${CANARY.apiKey}&page=2`)
      .set('Authorization', CANARY.authorization)
      .set('Cookie', CANARY.cookie)
      .set('User-Agent', 'sample-agent')
      .set('X-Forwarded-For', '198.51.100.9')
      .expect(200);

    const output = lines.join('');
    expect(lines.length).toBeGreaterThanOrEqual(3);
    for (const value of Object.values(CANARY)) {
      expect(output).not.toContain(value);
    }
    expect(output).not.toMatch(/canary/);

    const completed = lines.map(line => JSON.parse(line)).find(entry => entry.msg === 'request completed');
    expect(completed.req).toEqual({
      id: expect.anything(),
      method: 'GET',
      url: '/api/v2/sample?token=[redacted]&code=[redacted]&api_key=[redacted]&page=2',
      remoteAddress: expect.any(String),
      headers: expect.objectContaining({ 'user-agent': 'sample-agent', 'x-forwarded-for': '198.51.100.9' }),
    });
    expect(Object.keys(completed.req.headers).sort()).toEqual(
      expect.arrayContaining(['host', 'user-agent', 'x-forwarded-for']),
    );
    expect(completed.req.headers.authorization).toBeUndefined();
    expect(completed.req.headers.cookie).toBeUndefined();
    expect(completed.res).toEqual({ statusCode: 200 });

    const failed = lines.map(line => JSON.parse(line)).find(entry => entry.msg === 'upstream call failed');
    expect(Object.keys(failed.err).sort()).toEqual(['message', 'stack', 'type']);
    expect(failed.err.message).toBe('Request failed with status code 401');
  });

  it('redacts credential-like query values only', () => {
    expect(redactUrl('/a?token=x&page=1&Signature=y&password=z&secretKey=w')).toBe(
      '/a?token=[redacted]&page=1&Signature=[redacted]&password=[redacted]&secretKey=[redacted]',
    );
    expect(redactUrl('/a/b')).toBe('/a/b');
    expect(redactUrl('/a?flag')).toBe('/a?flag');
  });

  it('keeps only type, message and stack of errors', () => {
    expect(serializeError({ type: 'Error', message: 'm', stack: 's', config: { headers: {} }, response: {} })).toEqual({
      type: 'Error',
      message: 'm',
      stack: 's',
    });
  });
});
