import { forwardRef, Logger, Module } from '@nestjs/common';
import { EquityController } from './equity.controller';
import { AuthModule } from '~/auth/auth.module';
import { DefinitionModule } from '~/definition/definition.module';
import { ActivityService } from '~/activity/activity.service';
import { ActivityModule } from '~/activity/activity.module';
import { ActivityInfrastructure } from '~/activity/activity.infra';

@Module({
  imports: [
    DefinitionModule,
    forwardRef(() => AuthModule),
    ActivityModule
  ],
  controllers: [EquityController],
  providers: [Logger, ActivityService,ActivityInfrastructure]  
})
export class EquityModule {}