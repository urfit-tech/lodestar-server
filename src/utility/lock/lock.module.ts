import { DynamicModule, Module } from '@nestjs/common';

import { CacheService } from '../cache/cache.service';

import { DistributeLockService } from './distribute_lock.service';

@Module({})
export class LockModule {
  static forFeature(options: {
    key: string;
  }): DynamicModule {
    const { key } = options;
    return {
      module: LockModule,
      providers: [
        CacheService,
        DistributeLockService,
        {
          provide: 'KEY',
          useValue: key,
        },
      ],
      exports: [DistributeLockService],
    };
  }
}
