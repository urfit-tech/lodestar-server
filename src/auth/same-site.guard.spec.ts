import { ExecutionContext, Logger } from '@nestjs/common';
import { APIException } from '~/api.excetion';
import { AppService } from '~/app/app.service';
import { isCrossSiteRequest, SameSiteRequestGuard } from './same-site.guard';
import { createFakeAppLookup, FakeAppLookup } from './testing/fake-app-lookup';

jest.mock('~/app/app.service', () => ({ AppService: class AppService {} }));

const originalNodeEnv = process.env.NODE_ENV;

const contextOf = (request: Record<string, unknown>) =>
  ({ switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext);

describe('isCrossSiteRequest', () => {
  let lookup: FakeAppLookup;

  beforeEach(() => {
    lookup = createFakeAppLookup();
  });
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
        'Sec-Fetch-Site cross-site with a same-host Origin',
        { host: 'course.taotaoxi.net', origin: 'https://course.taotaoxi.net', 'sec-fetch-site': 'Cross-Site' },
      ],
      ['Origin on another registrable domain', { host: 'course.taotaoxi.net', origin: 'https://www.other-site.com' }],
      ['another app on the same registrable domain', { host: 'b.kolable.app', origin: 'https://a.kolable.app' }],
      [
        'a host the Origin app lists in its own setting',
        { host: 'b.kolable.app', origin: 'https://www.tenant-c-site.com' },
      ],
      [
        'a host of the same app on another registrable domain',
        { host: 'a.kolable.app', origin: 'https://www.tenant-a-site.com' },
      ],
      ['Origin null', { host: 'course.taotaoxi.net', origin: 'null' }],
      ['unparseable Origin', { host: 'course.taotaoxi.net', origin: 'not a url' }],
      ['empty Origin', { host: 'course.taotaoxi.net', origin: '' }],
      ['IP Origin', { host: 'course.taotaoxi.net', origin: 'https://54.249.157.218' }],
      ['Origin on a public suffix only', { host: 'www.example.com.tw', origin: 'https://com.tw' }],
      ['Origin sharing only the public suffix', { host: 'www.example.com.tw', origin: 'https://www.other.com.tw' }],
      ['Origin without a Host', { origin: 'https://course.taotaoxi.net' }],
      ['Origin with a malformed Host', { host: 'course.taotaoxi.net@other', origin: 'https://course.taotaoxi.net' }],
    ])('rejects %s', async (_label, headers) => {
      await expect(isCrossSiteRequest(headers, lookup)).resolves.toBe(true);
    });

    it.each([
      ['no Origin and no Sec-Fetch-Site', { host: 'course.taotaoxi.net' }],
      [
        'same origin',
        { host: 'course.taotaoxi.net', origin: 'https://course.taotaoxi.net', 'sec-fetch-site': 'same-origin' },
      ],
      ['same origin with an explicit port', { host: 'course.taotaoxi.net:443', origin: 'https://course.taotaoxi.net' }],
      [
        'same origin with a trailing dot and upper case',
        { host: 'Course.Taotaoxi.net', origin: 'https://COURSE.taotaoxi.net.' },
      ],
      [
        'www.taotaoxi.net to course.taotaoxi.net',
        { host: 'course.taotaoxi.net', origin: 'https://www.taotaoxi.net', 'sec-fetch-site': 'same-site' },
      ],
      [
        'estimators.ming-guang.com to www.ming-guang.com',
        { host: 'www.ming-guang.com', origin: 'https://estimators.ming-guang.com' },
      ],
      [
        'two hosts of one app under the same .com.tw domain',
        { host: 'course.commonhealth.com.tw', origin: 'https://www.commonhealth.com.tw' },
      ],
      ['a host the request host app lists', { host: 'b.kolable.app', origin: 'https://partner.example.org' }],
      ['Sec-Fetch-Site none', { host: 'course.taotaoxi.net', 'sec-fetch-site': 'none' }],
    ])('accepts %s', async (_label, headers) => {
      await expect(isCrossSiteRequest(headers, lookup)).resolves.toBe(false);
    });

    it('does not look anything up for a same-host Origin', async () => {
      await isCrossSiteRequest({ host: 'b.kolable.app', origin: 'https://b.kolable.app' }, lookup);
      expect(lookup.getAppInfoByHost).not.toHaveBeenCalled();
      expect(lookup.getAppHostNames).not.toHaveBeenCalled();
    });

    it('looks up only the request host', async () => {
      await isCrossSiteRequest({ host: 'b.kolable.app', origin: 'https://a.kolable.app' }, lookup);
      expect(lookup.getAppInfoByHost.mock.calls).toEqual([['b.kolable.app']]);
      expect(lookup.getAppHostNames.mock.calls).toEqual([['tenant-b']]);
    });

    it('rejects when the request host app cannot be looked up', async () => {
      lookup.getAppInfoByHost.mockRejectedValue(new Error('unavailable'));
      await expect(
        isCrossSiteRequest({ host: 'course.taotaoxi.net', origin: 'https://www.taotaoxi.net' }, lookup),
      ).resolves.toBe(true);
    });

    it('rejects when the app hosts cannot be looked up', async () => {
      lookup.getAppHostNames.mockRejectedValue(new Error('unavailable'));
      await expect(
        isCrossSiteRequest({ host: 'course.taotaoxi.net', origin: 'https://www.taotaoxi.net' }, lookup),
      ).resolves.toBe(true);
    });
  });

  it.each([
    ['an http Origin', { host: 'course.taotaoxi.net', origin: 'http://course.taotaoxi.net' }],
    ['an Origin on another port', { host: 'course.taotaoxi.net', origin: 'https://course.taotaoxi.net:8443' }],
    ['a localhost Origin', { host: 'api.kolable.com', origin: 'http://localhost:3000' }],
    ['an ngrok Origin', { host: 'api.kolable.com', origin: 'https://abc123.ngrok-free.app' }],
    ['a localhost Host', { host: 'localhost:8081', origin: 'https://www.other-site.com' }],
  ])('rejects %s in production', async (_label, headers) => {
    process.env.NODE_ENV = 'production';
    await expect(isCrossSiteRequest(headers, lookup)).resolves.toBe(true);
  });

  it.each([
    ['an http Origin', { host: 'course.taotaoxi.net', origin: 'http://course.taotaoxi.net' }],
    ['a localhost Origin', { host: 'api.kolable.com', origin: 'http://localhost:3000' }],
    ['an ngrok Origin', { host: 'api.kolable.com', origin: 'https://abc123.ngrok-free.app' }],
    ['a localhost Host', { host: 'localhost:8081', origin: 'https://www.other-site.com' }],
  ])('accepts %s outside production', async (_label, headers) => {
    process.env.NODE_ENV = 'staging';
    await expect(isCrossSiteRequest(headers, lookup)).resolves.toBe(false);
  });
});

describe('SameSiteRequestGuard', () => {
  let lookup: FakeAppLookup;
  let guard: SameSiteRequestGuard;
  let warn: jest.SpyInstance;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    lookup = createFakeAppLookup();
    guard = new SameSiteRequestGuard(lookup as unknown as AppService);
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    warn.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
  });

  const rejection = async (request: Record<string, unknown>) => {
    let thrown: unknown;
    try {
      await guard.canActivate(contextOf(request));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(APIException);
    return thrown as APIException;
  };

  it('leaves GET requests alone', async () => {
    const request = {
      method: 'GET',
      originalUrl: '/api/v1/auth/x',
      headers: { host: 'a.example.com', origin: 'https://b.example' },
    };
    await expect(guard.canActivate(contextOf(request))).resolves.toBe(true);
    expect(lookup.getAppInfoByHost).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('accepts POST requests from another host of the same app', async () => {
    const request = {
      method: 'POST',
      originalUrl: '/api/v1/auth/general-login',
      headers: { host: 'course.taotaoxi.net', origin: 'https://www.taotaoxi.net' },
    };
    await expect(guard.canActivate(contextOf(request))).resolves.toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    [{ origin: 'https://www.other-site.com' }, 'origin_site=other-site.com host=course.taotaoxi.net sfs=-'],
    [{ origin: 'null' }, 'origin_site=null host=course.taotaoxi.net sfs=-'],
    [{ origin: 'garbage' }, 'origin_site=invalid host=course.taotaoxi.net sfs=-'],
    [{ origin: 'https://54.249.157.218' }, 'origin_site=invalid host=course.taotaoxi.net sfs=-'],
    [{ 'sec-fetch-site': 'cross-site' }, 'origin_site=- host=course.taotaoxi.net sfs=cross-site'],
  ])('rejects %j with E_CROSS_SITE and one log line', async (headers, expected) => {
    const request = {
      method: 'POST',
      originalUrl: '/api/v2/auth/general-login?x=1',
      headers: { host: 'course.taotaoxi.net', cookie: 'connect.sid=secret', ...headers },
      body: { password: 'secret' },
    };
    const exception = await rejection(request);
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

  it('rejects a POST from another app on the same registrable domain', async () => {
    const exception = await rejection({
      method: 'POST',
      originalUrl: '/api/v1/auth/refresh-token',
      headers: { host: 'b.kolable.app', origin: 'https://a.kolable.app' },
    });
    expect(exception.getStatus()).toBe(403);
    expect(exception.code).toBe('E_CROSS_SITE');
    expect(warn.mock.calls[0][0]).toBe(
      'cross-site-auth-reject route=/api/v1/auth/refresh-token origin_site=kolable.app host=b.kolable.app sfs=-',
    );
  });

  it('rejects when the lookup fails', async () => {
    lookup.getAppInfoByHost.mockRejectedValue(new Error('unavailable'));
    const exception = await rejection({
      method: 'POST',
      originalUrl: '/api/v1/auth/general-login',
      headers: { host: 'course.taotaoxi.net', origin: 'https://www.taotaoxi.net' },
    });
    expect(exception.getStatus()).toBe(403);
    expect(exception.code).toBe('E_CROSS_SITE');
  });
});
