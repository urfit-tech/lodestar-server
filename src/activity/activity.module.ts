import { Logger, Module, forwardRef } from '@nestjs/common';
import { ActivityTicketService } from './activity-ticket/activity-ticket.service';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityInfrastructure } from './activity.infra';
import { AuthModule } from '~/auth/auth.module';
import { DefinitionModule } from '~/definition/definition.module';

@Module({
  providers: [Logger, ActivityTicketService, ActivityService, ActivityInfrastructure],
  imports: [DefinitionModule, forwardRef(() => AuthModule)],
  controllers: [ActivityController],
})
export class ActivityModule {}
