import { ExecutionContext, Logger } from '@nestjs/common';
import { APIException } from '~/api.excetion';
import { isCrossSiteRequest, SameSiteRequestGuard } from './same-site.guard';

const originalNodeEnv = process.env.NODE_ENV;

const contextOf = (request: Record<string, unknown>) =>
  ({ switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext);

describe('isCrossSiteRequest', () => {
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe.each(['production', 'staging'])('NODE_ENV=%s', nodeEnv => {
    beforeEach(() => {
      process.env.NODE_ENV = nodeEnv;
    });

    it.each([
      ['Sec-Fetch-Site cross-site without Origin', { host: 'course.taotaoxi.net', 'sec-fetch-site': 'cross-site' }],
      [
        'Sec-Fetch-Site cross-site with a same-site Origin',
        { host: 'course.taotaoxi.net', origin: 'https://course.taotaoxi.net', 'sec-fetch-site': 'Cross-Site' },
      ],
      ['Origin on another registrable domain', { host: 'course.taotaoxi.net', origin: 'https://www.other-site.com' }],
      ['Origin null', { host: 'course.taotaoxi.net', origin: 'null' }],
      ['unparseable Origin', { host: 'course.taotaoxi.net', origin: 'not a url' }],
      ['empty Origin', { host: 'course.taotaoxi.net', origin: '' }],
      ['IP Origin', { host: 'course.taotaoxi.net', origin: 'https://54.249.157.218' }],
      ['Origin on a public suffix only', { host: 'www.example.com.tw', origin: 'https://com.tw' }],
      ['Origin sharing only the public suffix', { host: 'www.example.com.tw', origin: 'https://www.other.com.tw' }],
      ['Origin with a host that is not Listed', { host: '10.0.0.1:8081', origin: 'https://10.0.0.1:8081' }],
      ['Origin without a Host', { origin: 'https://course.taotaoxi.net' }],
    ])('rejects %s', (_label, headers) => {
      expect(isCrossSiteRequest(headers)).toBe(true);
    });

    it.each([
      ['no Origin and no Sec-Fetch-Site', { host: 'course.taotaoxi.net' }],
      [
        'same origin',
        { host: 'course.taotaoxi.net', origin: 'https://course.taotaoxi.net', 'sec-fetch-site': 'same-origin' },
      ],
      ['same origin with an explicit port', { host: 'course.taotaoxi.net:443', origin: 'https://course.taotaoxi.net' }],
      [
        'www.taotaoxi.net to course.taotaoxi.net',
        { host: 'course.taotaoxi.net', origin: 'https://www.taotaoxi.net', 'sec-fetch-site': 'same-site' },
      ],
      [
        'estimators.ming-guang.com to www.ming-guang.com',
        { host: 'www.ming-guang.com', origin: 'https://estimators.ming-guang.com' },
      ],
      [
        'two hosts under the same .com.tw domain',
        { host: 'course.commonhealth.com.tw', origin: 'https://www.commonhealth.com.tw' },
      ],
      ['Sec-Fetch-Site none', { host: 'course.taotaoxi.net', 'sec-fetch-site': 'none' }],
    ])('accepts %s', (_label, headers) => {
      expect(isCrossSiteRequest(headers)).toBe(false);
    });
  });

  it.each([
    ['localhost Origin', { host: 'api.kolable.com', origin: 'http://localhost:3000' }],
    ['ngrok Origin', { host: 'api.kolable.com', origin: 'https://abc123.ngrok-free.app' }],
    ['localhost Host', { host: 'localhost:8081', origin: 'https://www.other-site.com' }],
  ])('rejects %s in production', (_label, headers) => {
    process.env.NODE_ENV = 'production';
    expect(isCrossSiteRequest(headers)).toBe(true);
  });

  it.each([
    ['localhost Origin', { host: 'api.kolable.com', origin: 'http://localhost:3000' }],
    ['ngrok Origin', { host: 'api.kolable.com', origin: 'https://abc123.ngrok-free.app' }],
    ['localhost Host', { host: 'localhost:8081', origin: 'https://www.other-site.com' }],
  ])('accepts %s outside production', (_label, headers) => {
    process.env.NODE_ENV = 'staging';
    expect(isCrossSiteRequest(headers)).toBe(false);
  });
});

describe('SameSiteRequestGuard', () => {
  const guard = new SameSiteRequestGuard();
  let warn: jest.SpyInstance;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    warn.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('leaves GET requests alone', () => {
    const request = {
      method: 'GET',
      originalUrl: '/api/v1/auth/x',
      headers: { host: 'a.example.com', origin: 'https://b.example' },
    };
    expect(guard.canActivate(contextOf(request))).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });

  it('accepts same-site POST requests', () => {
    const request = {
      method: 'POST',
      originalUrl: '/api/v1/auth/general-login',
      headers: { host: 'course.taotaoxi.net', origin: 'https://www.taotaoxi.net' },
    };
    expect(guard.canActivate(contextOf(request))).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    [{ origin: 'https://www.other-site.com' }, 'origin_site=other-site.com sfs=-'],
    [{ origin: 'null' }, 'origin_site=null sfs=-'],
    [{ origin: 'garbage' }, 'origin_site=invalid sfs=-'],
    [{ origin: 'https://54.249.157.218' }, 'origin_site=invalid sfs=-'],
    [{ 'sec-fetch-site': 'cross-site' }, 'origin_site=- sfs=cross-site'],
  ])('rejects %j with E_CROSS_SITE and one log line', (headers, expected) => {
    const request = {
      method: 'POST',
      originalUrl: '/api/v2/auth/general-login?x=1',
      headers: { host: 'course.taotaoxi.net', cookie: 'connect.sid=secret', ...headers },
      body: { password: 'secret' },
    };
    let thrown: unknown;
    try {
      guard.canActivate(contextOf(request));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(APIException);
    const exception = thrown as APIException;
    expect(exception.getStatus()).toBe(403);
    expect({ code: exception.code, message: exception.message, result: exception.result }).toEqual({
      code: 'E_CROSS_SITE',
      message: 'cross-site request rejected',
      result: null,
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toBe(`cross-site-auth-reject route=/api/v2/auth/general-login ${expected}`);
    expect(String(warn.mock.calls[0][0])).not.toContain('secret');
  });
});
