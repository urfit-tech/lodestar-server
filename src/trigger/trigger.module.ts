import { Module } from '@nestjs/common';

import { CacheService } from '~/utility/cache/cache.service';

import { TriggerService } from './trigger.service';

@Module({
  providers: [TriggerService, CacheService],
})
export class TriggerModule {}
