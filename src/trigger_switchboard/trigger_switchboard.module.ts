import { Module } from '@nestjs/common';
import { AuthModule } from '~/auth/auth.module';
import { TriggeredSwitchboardController } from './trigger_switchboard.controller';
import { TriggerSwitchboardService } from './trigger_switchboard.service';

@Module({
  imports: [AuthModule],
  controllers: [TriggeredSwitchboardController],
  providers: [TriggerSwitchboardService],
})
export class TriggerSwitchboardModule {}
