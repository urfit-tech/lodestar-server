import { Module } from '@nestjs/common';
import { ActivityTicketService } from './activity-ticket/activity-ticket.service';
import { ActivityController } from './activity.controller';

@Module({
  providers: [ActivityTicketService],
  controllers: [ActivityController],
})
export class ActivityModule {}
