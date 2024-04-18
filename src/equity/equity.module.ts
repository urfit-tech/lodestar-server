import { forwardRef, Logger, Module } from '@nestjs/common';
import { EquityController } from './equity.controller';
import { AuthModule } from '~/auth/auth.module';
import { DefinitionModule } from '~/definition/definition.module';
import { ActivityTicketInfrastructure } from '~/activity/activity-ticket/activity-ticket.infra';
import { ActivityTicketService } from '~/activity/activity-ticket/activity-ticket.service';
import { ActivityModule } from '~/activity/activity.module';

@Module({
  controllers: [EquityController],
  imports: [DefinitionModule, forwardRef(()=> AuthModule), ActivityModule],
  providers: [Logger, ActivityTicketInfrastructure, ActivityTicketService]  
})
export class EquityModule {}