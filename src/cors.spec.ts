import corsOptionDelegate from './cors';
import { AppService } from './app/app.service';
import { createFakeAppLookup, FakeAppLookup } from './auth/testing/fake-app-lookup';

jest.mock('./app/app.service', () => ({ AppService: class AppService {} }));

let lookup: FakeAppLookup;
const app: any = {
  get: jest.fn((token: unknown) => (token === AppService ? lookup : undefined)),
};

const GRANTED = { credentials: true, origin: true };
const DENIED = { credentials: false, origin: false };

const evaluate = async (host: string, origin: string) => {
  const callback = jest.fn();
  const res = { vary: jest.fn() };
  await corsOptionDelegate({ headers: { host, origin }, res }, callback, app);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(res.vary).toHaveBeenCalledWith('Origin');
  return callback.mock.calls[0][1];
};

describe('corsOptionDelegate', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    lookup = createFakeAppLookup();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => {
    logSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe.each(['production', 'staging'])('in %s', env => {
    beforeEach(() => {
      process.env.NODE_ENV = env;
    });

    it.each([
      ['the request host itself', 'course.taotaoxi.net', 'https://course.taotaoxi.net'],
      ['the request host with an explicit port in Host', 'course.taotaoxi.net:443', 'https://course.taotaoxi.net'],
      ['the request host with a trailing dot', 'course.taotaoxi.net', 'https://course.taotaoxi.net.'],
      ['another host of the same app', 'course.taotaoxi.net', 'https://www.taotaoxi.net'],
      ['another host of the same app', 'www.ming-guang.com', 'https://estimators.ming-guang.com'],
      ['another host of the same app under .com.tw', 'course.commonhealth.com.tw', 'https://www.commonhealth.com.tw'],
      ['a host the request host app lists', 'b.kolable.app', 'https://partner.example.org'],
      ['a host of the request host app it lists', 'b.kolable.app', 'https://console.tenant-b-site.com'],
    ])('grants %s', async (_label, host, origin) => {
      expect(await evaluate(host, origin)).toEqual(GRANTED);
    });

    it.each([
      ['another app on the same registrable domain', 'b.kolable.app', 'https://a.kolable.app'],
      ['a host the Origin app lists in its own setting', 'b.kolable.app', 'https://www.tenant-c-site.com'],
      ['an Origin app listing the request host', 'b.kolable.app', 'https://c.kolable.app'],
      ['a host of the same app on another registrable domain', 'a.kolable.app', 'https://www.tenant-a-site.com'],
      ['an unrelated origin', 'api.kolable.com', 'https://other.example.org'],
      ['an origin on a host without an app', 'unknown.kolable.app', 'https://www.kolable.app'],
      ['an IP origin', 'course.taotaoxi.net', 'https://54.249.157.218'],
    ])('does not grant %s', async (_label, host, origin) => {
      expect(await evaluate(host, origin)).toEqual(DENIED);
    });

    it('does not look anything up for the request host itself', async () => {
      await evaluate('b.kolable.app', 'https://b.kolable.app');
      expect(lookup.getAppInfoByHost).not.toHaveBeenCalled();
      expect(lookup.getAppHostNames).not.toHaveBeenCalled();
    });

    it('looks up only the request host and its app', async () => {
      await evaluate('b.kolable.app', 'https://www.tenant-c-site.com');
      await evaluate('b.kolable.app', 'https://a.kolable.app');
      expect(lookup.getAppInfoByHost.mock.calls).toEqual([['b.kolable.app'], ['b.kolable.app']]);
      expect(lookup.getAppHostNames.mock.calls).toEqual([['tenant-b']]);
    });

    it.each([
      ['the app lookup', (l: FakeAppLookup) => l.getAppInfoByHost.mockRejectedValue(new Error('unavailable'))],
      ['the app hosts lookup', (l: FakeAppLookup) => l.getAppHostNames.mockRejectedValue(new Error('unavailable'))],
    ])('does not grant when %s fails', async (_label, fail) => {
      fail(lookup);
      expect(await evaluate('course.taotaoxi.net', 'https://www.taotaoxi.net')).toEqual(DENIED);
    });

    it('does not grant when the allowed domains setting is not valid JSON', async () => {
      lookup.getAppInfoByHost.mockResolvedValue({ id: 'tenant-b', settings: { cors_allowed_domains: '[' } } as any);
      expect(await evaluate('b.kolable.app', 'https://partner.example.org')).toEqual(DENIED);
    });

    it('logs one line with the origin site and the host when not granted', async () => {
      await evaluate('b.kolable.app', 'https://a.kolable.app');
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy.mock.calls[0][0]).toBe(
        '[CORS-INFO] cors-reject reason=other origin_site=kolable.app host=b.kolable.app',
      );
    });
  });

  describe('in production', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it.each([
      'http://localhost:3000',
      'https://localhost',
      'https://abc123.ngrok.io',
      'https://abc123.ngrok-free.app',
      'https://ngrok.example.org',
      'http://course.taotaoxi.net',
      'https://course.taotaoxi.net:8443',
      'http://www.taotaoxi.net',
    ])('does not grant %s', async origin => {
      expect(await evaluate('course.taotaoxi.net', origin)).toEqual(DENIED);
    });

    it('accepts an explicit default port', async () => {
      expect(await evaluate('course.taotaoxi.net', 'https://course.taotaoxi.net:443')).toEqual(GRANTED);
    });

    it('does not grant any origin because the Host is local', async () => {
      expect(await evaluate('localhost:8081', 'https://www.other-site.com')).toEqual(DENIED);
    });
  });

  describe.each(['development', 'test', 'staging'])('in %s', env => {
    beforeEach(() => {
      process.env.NODE_ENV = env;
    });

    it.each(['http://localhost:3000', 'https://abc123.ngrok.io', 'https://abc123.ngrok-free.app'])(
      'grants %s',
      async origin => {
        expect(await evaluate('api.kolable.com', origin)).toEqual(GRANTED);
      },
    );

    it('grants any web origin on a local Host', async () => {
      expect(await evaluate('localhost:8081', 'https://www.other-site.com')).toEqual(GRANTED);
    });

    it('grants an http origin for the request host itself', async () => {
      expect(await evaluate('course.taotaoxi.net', 'http://course.taotaoxi.net:8080')).toEqual(GRANTED);
    });
  });

  describe.each(['production', 'development', 'test', 'staging'])('in %s', env => {
    beforeEach(() => {
      process.env.NODE_ENV = env;
    });

    it.each(['null', 'not a url', 'https://', '', 'file:///etc/hosts', 'chrome-extension://abc'])(
      'denies Origin %j without throwing',
      async origin => {
        expect(await evaluate('api.kolable.com', origin)).toEqual(DENIED);
        expect(lookup.getAppInfoByHost).not.toHaveBeenCalled();
      },
    );

    it('denies an unparseable Origin even when the Host starts with localhost', async () => {
      expect(await evaluate('localhost:8081', 'null')).toEqual(DENIED);
    });

    it('denies a malformed Host', async () => {
      expect(await evaluate('course.taotaoxi.net@www.taotaoxi.net', 'https://www.taotaoxi.net')).toEqual(DENIED);
      expect(lookup.getAppInfoByHost).not.toHaveBeenCalled();
    });
  });

  it('denies instead of rejecting when an unexpected error occurs', async () => {
    app.get.mockImplementationOnce(() => {
      throw new Error('unexpected');
    });
    expect(await evaluate('api.kolable.com', 'https://www.example.org')).toEqual(DENIED);
  });

  it('does not grant when Origin is absent', async () => {
    expect(await evaluate('api.kolable.com', '')).toEqual(DENIED);
  });
});
