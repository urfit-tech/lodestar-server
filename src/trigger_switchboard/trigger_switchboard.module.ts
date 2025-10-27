import { Module } from '@nestjs/common';
import { TriggeredSwitchboardController } from './trigger_switchboard.controller';
import { TriggerSwitchboardService } from './trigger_switchboard.service';

@Module({
  controllers: [TriggeredSwitchboardController],
  providers: [TriggerSwitchboardService],
})

export class TriggerSwitchboardModule {}
