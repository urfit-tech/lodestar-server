import { ConfigService } from '@nestjs/config';

import { requireSessionSecret } from './session-secret';

// main.ts runs its bootstrap on import; the Nest application is replaced by a chainable stub.
jest.mock('./application.module', () => ({ ApplicationModule: class ApplicationModule {} }));
jest.mock('./runner/runner.module', () => ({ RunnerModule: {} }));
jest.mock('./runner/runner.type', () => ({ RunnerType: {} }));
jest.mock('./tasker/tasker.module', () => ({ TaskerModule: {} }));
jest.mock('./tasker/tasker.type', () => ({ TaskerType: {} }));
jest.mock('./tasker/watchdog', () => ({ startTaskerWatchdog: jest.fn() }));
jest.mock('./member/member.module', () => ({ MemberModule: class MemberModule {} }));
jest.mock('./auth/auth.module', () => ({ AuthModule: class AuthModule {} }));
jest.mock('./swagger-config/swagger-config.service', () => ({ SwaggerConfigService: { setupSwagger: jest.fn() } }));
jest.mock('./utility/cache/cache.service', () => ({ CacheService: class CacheService {} }));
jest.mock('./utility/shutdown/shutdown.service', () => ({ ShutdownService: class ShutdownService {} }));
jest.mock('connect-redis', () => ({ __esModule: true, default: class RedisStore {} }));
jest.mock('express-session', () => (options: unknown) => (mockSession as jest.Mock)(options));
jest.mock('./cors', () => ({ __esModule: true, default: jest.fn() }));

const mockSession = jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next());

const buildApp = (sessionSecret: unknown) => {
  const config = new ConfigService({ NODE_ENV: 'test', SESSION_SECRET: sessionSecret });
  const app: any = {};
  for (const method of [
    'use',
    'set',
    'useGlobalPipes',
    'useGlobalFilters',
    'setGlobalPrefix',
    'enableVersioning',
    'enableShutdownHooks',
    'useLogger',
  ]) {
    app[method] = jest.fn(() => app);
  }
  app.get = jest.fn((token: any) => (token?.name === 'ConfigService' ? config : { getClient: () => ({}) }));
  app.listen = jest.fn(async () => undefined);
  return app;
};

const runBootstrap = async (sessionSecret: unknown) => {
  const app = buildApp(sessionSecret);
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as any);
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  let createSpy: jest.SpyInstance | undefined;
  try {
    jest.isolateModules(() => {
      // main.ts gets its own module registry here, so the factory is replaced in that registry
      const { NestFactory } = jest.requireActual('@nestjs/core');
      createSpy = jest.spyOn(NestFactory, 'create').mockResolvedValue(app);
      require('./main');
    });
    await new Promise(resolve => setTimeout(resolve, 50));
  } finally {
    createSpy?.mockRestore();
  }
  const exitCodes = exitSpy.mock.calls.map(([code]) => code);
  const errors = errorSpy.mock.calls.map(([error]) => error);
  exitSpy.mockRestore();
  errorSpy.mockRestore();
  expect(createSpy).toBeDefined();
  return { app, exitCodes, errors };
};

describe('session secret at startup', () => {
  const originalWorkerName = process.env.WORKER_NAME;

  beforeAll(() => {
    delete process.env.WORKER_NAME;
  });
  afterAll(() => {
    if (originalWorkerName === undefined) delete process.env.WORKER_NAME;
    else process.env.WORKER_NAME = originalWorkerName;
  });
  beforeEach(() => {
    mockSession.mockClear();
  });

  it('stops startup when SESSION_SECRET is an empty string', async () => {
    const { app, exitCodes, errors } = await runBootstrap('');

    expect(exitCodes).toEqual([1]);
    expect(String((errors[0] as Error).message)).toContain('SESSION_SECRET');
    expect(mockSession).not.toHaveBeenCalled();
    expect(app.listen).not.toHaveBeenCalled();
  });

  it('uses the configured secret for the session cookie', async () => {
    const { app, exitCodes } = await runBootstrap('synthetic-session-secret');

    expect(exitCodes).toEqual([]);
    expect(mockSession).toHaveBeenCalledWith(expect.objectContaining({ secret: 'synthetic-session-secret' }));
    expect(app.listen).toHaveBeenCalled();
  });

  it('rejects empty and blank values', () => {
    expect(() => requireSessionSecret('')).toThrow('SESSION_SECRET');
    expect(() => requireSessionSecret('   ')).toThrow('SESSION_SECRET');
    expect(() => requireSessionSecret(undefined)).toThrow('SESSION_SECRET');
    expect(requireSessionSecret('value')).toBe('value');
  });
});
