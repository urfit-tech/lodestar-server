import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import 'reflect-metadata';

import { AppService } from '~/app/app.service';
import { CacheService } from '~/utility/cache/cache.service';
import { AuthController } from './auth.controller';
import { AuthModule } from './auth.module';
import { DeviceController } from './device/device.controller';
import { DeviceModule } from './device/device.module';
import { SameSiteRequestGuard } from './same-site.guard';

// External connections (database, cache, configuration) are stubbed; every application provider is real.
@Global()
@Module({
  providers: [
    { provide: getEntityManagerToken(), useValue: {} },
    { provide: ConfigService, useValue: { get: () => 'stub', getOrThrow: () => 'stub' } },
  ],
  exports: [getEntityManagerToken(), ConfigService],
})
class ExternalStubModule {}

const compile = (feature: unknown) =>
  Test.createTestingModule({ imports: [ExternalStubModule, feature as any] })
    .overrideProvider(CacheService)
    .useValue({ getClient: () => ({}) })
    .compile();

describe('modules using SameSiteRequestGuard', () => {
  it.each([
    ['DeviceModule', DeviceModule, DeviceController],
    ['AuthModule', AuthModule, AuthController],
  ])('%s resolves the guard for its controller', async (_label, feature, controller) => {
    const moduleRef = await compile(feature);
    const guard = moduleRef.get(SameSiteRequestGuard, { strict: false });
    expect(guard).toBeInstanceOf(SameSiteRequestGuard);
    expect((guard as any).appService).toBeInstanceOf(AppService);
    expect(moduleRef.get(controller, { strict: false })).toBeInstanceOf(controller);
    await moduleRef.close();
  });
});
