import { DynamicModule, Module } from '@nestjs/common';

import { CacheService } from '../cache/cache.service';

import { DistributedLockService } from './distributed_lock.service';

@Module({})
export class LockModule {
  static forFeature(options: {
    key: string;
    maxHolderAmount: number;
  }): DynamicModule {
    const { key, maxHolderAmount } = options;
    return {
      module: LockModule,
      providers: [
        CacheService,
        DistributedLockService,
        { provide: 'KEY', useValue: key },
        { provide: 'MAX_HOLDER_AMOUNT', useValue: maxHolderAmount },
      ],
      exports: [DistributedLockService],
    };
  }
}
