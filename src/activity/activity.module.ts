import { Module } from '@nestjs/common'
import { ActivityTicketService } from './activity-ticket/activity-ticket.service'

@Module({
  providers: [ActivityTicketService],
})
export class ActivityModule {}
