import { AppService } from './app.service';

const build = (client: Record<string, jest.Mock>, hosts: string[] | Error) => {
  const appInfra = {
    getAppHosts: jest.fn(async () => {
      if (hosts instanceof Error) {
        throw hosts;
      }
      return hosts.map(host => ({ host }));
    }),
  };
  const logger = { error: jest.fn() };
  const service = new AppService(
    appInfra as any,
    { getClient: () => client } as any,
    {} as any,
    {} as any,
    logger as any,
  );
  return { service, appInfra, logger };
};

const multiClient = () => {
  const commands: Array<[string, ...unknown[]]> = [];
  const chain: any = {
    del: (...args: unknown[]) => (commands.push(['del', ...args]), chain),
    sadd: (...args: unknown[]) => (commands.push(['sadd', ...args]), chain),
    expire: (...args: unknown[]) => (commands.push(['expire', ...args]), chain),
    exec: jest.fn(async () => []),
  };
  return { commands, multi: jest.fn(() => chain) };
};

describe('AppService.getAppHostNames', () => {
  it('returns the cached hosts without reading the database', async () => {
    const client = { smembers: jest.fn(async () => ['a.example.com', 'b.example.com']) };
    const { service, appInfra } = build(client, []);
    await expect(service.getAppHostNames('app-1')).resolves.toEqual(['a.example.com', 'b.example.com']);
    expect(client.smembers).toHaveBeenCalledWith('app:app-1:hosts');
    expect(appInfra.getAppHosts).not.toHaveBeenCalled();
  });

  it('reads the database and caches the hosts for five minutes', async () => {
    const { commands, multi } = multiClient();
    const client = { smembers: jest.fn(async () => []), multi };
    const { service } = build(client, ['a.example.com', 'b.example.com']);
    await expect(service.getAppHostNames('app-1')).resolves.toEqual(['a.example.com', 'b.example.com']);
    expect(commands).toEqual([
      ['del', 'app:app-1:hosts'],
      ['sadd', 'app:app-1:hosts', 'a.example.com', 'b.example.com'],
      ['expire', 'app:app-1:hosts', 300],
    ]);
  });

  it('reads the database when the cache is unavailable', async () => {
    const client = {
      smembers: jest.fn(async () => {
        throw new Error('unavailable');
      }),
      multi: jest.fn(() => {
        throw new Error('unavailable');
      }),
    };
    const { service } = build(client, ['a.example.com']);
    await expect(service.getAppHostNames('app-1')).resolves.toEqual(['a.example.com']);
  });

  it('propagates database errors', async () => {
    const client = { smembers: jest.fn(async () => []) };
    const { service } = build(client, new Error('database unavailable'));
    await expect(service.getAppHostNames('app-1')).rejects.toThrow('database unavailable');
  });

  it('does not cache an empty host list', async () => {
    const { multi } = multiClient();
    const client = { smembers: jest.fn(async () => []), multi };
    const { service } = build(client, []);
    await expect(service.getAppHostNames('app-1')).resolves.toEqual([]);
    expect(multi).not.toHaveBeenCalled();
  });
});
