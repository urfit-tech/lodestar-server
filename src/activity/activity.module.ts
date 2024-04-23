import { Logger, Module, forwardRef } from '@nestjs/common';
import { ActivityTicketService } from './activity-ticket/activity-ticket.service';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityInfrastructure } from './activity.infra';
import { AuthModule } from '~/auth/auth.module';
import { DefinitionModule } from '~/definition/definition.module';
import { ActivityTicketInfrastructure } from './activity-ticket/activity-ticket.infra';

@Module({
  providers: [
    Logger,
    ActivityTicketService,
    ActivityService,
    ActivityTicketService,
    ActivityInfrastructure,
    ActivityTicketInfrastructure,
  ],
  imports: [DefinitionModule, forwardRef(() => AuthModule)],
  controllers: [ActivityController],
  exports: [ActivityService, ActivityTicketService, ActivityModule],
})
export class ActivityModule {}
