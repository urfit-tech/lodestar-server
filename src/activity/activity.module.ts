import { Logger, Module } from '@nestjs/common';
import { ActivityTicketService } from './activity-ticket/activity-ticket.service';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityInfrastructure } from './activity.infra';
import { DefinitionModule } from '~/definition/definition.module';
import { UtilityModule } from '~/utility/utility.module';
import { UtilityService } from '~/utility/utility.service';

@Module({
  providers: [Logger, ActivityTicketService, ActivityService, ActivityInfrastructure, UtilityService],
  imports: [DefinitionModule, UtilityModule],
  controllers: [ActivityController],
})
export class ActivityModule {}
