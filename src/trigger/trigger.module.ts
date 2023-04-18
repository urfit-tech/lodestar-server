import { Module } from '@nestjs/common';

import { CacheService } from '~/utility/cache/cache.service';

import { TriggerController } from './trigger.controller';
import { TriggerService } from './trigger.service';

@Module({
  controllers: [TriggerController],
  providers: [TriggerService, CacheService],
})
export class TriggerModule {}
