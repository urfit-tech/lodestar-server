import corsOptionDelegate from './cors';
import { AppService } from './app/app.service';

jest.mock('./app/app.service', () => ({ AppService: class AppService {} }));

const getAppInfoByHost = jest.fn();
const app: any = {
  get: jest.fn((token: unknown) => (token === AppService ? { getAppInfoByHost } : undefined)),
};

const evaluate = async (host: string, origin: string) => {
  const callback = jest.fn();
  await corsOptionDelegate({ headers: { host, origin } }, callback, app);
  expect(callback).toHaveBeenCalledTimes(1);
  return callback.mock.calls[0][1];
};

describe('corsOptionDelegate', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    getAppInfoByHost.mockResolvedValue({ settings: {} });
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => {
    logSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
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
    ])('does not grant %s', async origin => {
      const options = await evaluate('api.kolable.com', origin);
      expect(options).toEqual({ credentials: false, origin: false });
    });

    it('still grants an origin on the same registrable domain', async () => {
      const options = await evaluate('api.kolable.com', 'https://demo.kolable.com');
      expect(options).toEqual({ credentials: true, origin: true });
      expect(getAppInfoByHost).not.toHaveBeenCalled();
    });

    it('still grants an origin listed in the app cors_allowed_domains setting', async () => {
      getAppInfoByHost.mockResolvedValue({
        settings: { cors_allowed_domains: JSON.stringify(['www.example.org']) },
      });
      const options = await evaluate('api.kolable.com', 'https://www.example.org');
      expect(options).toEqual({ credentials: true, origin: true });
    });

    it('does not grant an unrelated origin', async () => {
      const options = await evaluate('api.kolable.com', 'https://other.example.org');
      expect(options).toEqual({ credentials: false, origin: false });
    });
  });

  describe.each(['development', 'test', 'staging'])('in %s', env => {
    beforeEach(() => {
      process.env.NODE_ENV = env;
    });

    it.each(['http://localhost:3000', 'https://abc123.ngrok.io', 'https://abc123.ngrok-free.app'])(
      'grants %s',
      async origin => {
        const options = await evaluate('api.kolable.com', origin);
        expect(options).toEqual({ credentials: true, origin: true });
      },
    );

    it('grants an origin on the same registrable domain', async () => {
      const options = await evaluate('api.kolable.com', 'https://demo.kolable.com');
      expect(options).toEqual({ credentials: true, origin: true });
    });

    it('does not grant an unrelated origin', async () => {
      const options = await evaluate('api.kolable.com', 'https://other.example.org');
      expect(options).toEqual({ credentials: false, origin: false });
    });
  });

  describe.each(['production', 'development', 'test', 'staging'])('in %s', env => {
    beforeEach(() => {
      process.env.NODE_ENV = env;
    });

    it.each(['null', 'not a url', 'https://', ''])('denies Origin %j without throwing', async origin => {
      const options = await evaluate('api.kolable.com', origin);
      expect(options).toEqual({ credentials: false, origin: false });
      expect(getAppInfoByHost).not.toHaveBeenCalled();
    });

    it('denies an unparseable Origin even when the Host starts with localhost', async () => {
      const options = await evaluate('localhost:8081', 'null');
      expect(options).toEqual({ credentials: false, origin: false });
    });
  });

  it('denies instead of rejecting when an unexpected error occurs', async () => {
    app.get.mockImplementationOnce(() => {
      throw new Error('unexpected');
    });
    const options = await evaluate('api.kolable.com', 'https://www.example.org');
    expect(options).toEqual({ credentials: false, origin: false });
  });

  it('denies an unrelated origin when the app lookup fails', async () => {
    process.env.NODE_ENV = 'production';
    getAppInfoByHost.mockRejectedValue(new Error('no app'));
    const options = await evaluate('api.kolable.com', 'https://www.example.org');
    expect(options).toEqual({ credentials: false, origin: false });
  });

  it('looks up the allowed domains by the Origin hostname', async () => {
    process.env.NODE_ENV = 'production';
    getAppInfoByHost.mockResolvedValue({ settings: { cors_allowed_domains: JSON.stringify(['www.example.org']) } });
    const options = await evaluate('api.kolable.com', 'https://www.example.org:8443');
    expect(options).toEqual({ credentials: true, origin: true });
    expect(getAppInfoByHost).toHaveBeenCalledWith('www.example.org');
  });

  it('does not grant when Origin is absent', async () => {
    const options = await evaluate('api.kolable.com', '');
    expect(options).toEqual({ credentials: false, origin: false });
  });
});
