import { Logger, Module } from '@nestjs/common';
import { ActivityTicketService } from './activity-ticket/activity-ticket.service';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityInfrastructure } from './activity.infra';

@Module({
  providers: [Logger, ActivityTicketService, ActivityService, ActivityInfrastructure],
  controllers: [ActivityController],
})
export class ActivityModule {}
