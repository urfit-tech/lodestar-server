import { forwardRef, Logger, Module } from '@nestjs/common';
import { ActivityTicketService } from './activity-ticket/activity-ticket.service';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityInfrastructure } from './activity.infra';
import { DefinitionModule } from '~/definition/definition.module';
import { ActivityTicketInfrastructure } from './activity-ticket/activity-ticket.infra';
import { UtilityModule } from '~/utility/utility.module';
import { UtilityService } from '~/utility/utility.service';
import { AuthModule } from '~/auth/auth.module';

@Module({
  providers: [
    Logger,
    ActivityTicketService,
    ActivityService,
    ActivityInfrastructure,
    ActivityTicketInfrastructure,
    UtilityService,
  ],
  imports: [DefinitionModule, UtilityModule, forwardRef(() => AuthModule)],
  controllers: [ActivityController],
  exports: [ActivityService, ActivityTicketService, ActivityModule],
})
export class ActivityModule {}
