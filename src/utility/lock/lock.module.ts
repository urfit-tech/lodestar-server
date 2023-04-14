import { Module } from '@nestjs/common';

import { CacheService } from '../cache/cache.service';

import { DistributeLockService } from './distribute_lock.service';

@Module({
  providers: [CacheService, DistributeLockService],
  exports: [DistributeLockService],
})
export class LockModule {}
