import { forwardRef, Module } from '@nestjs/common';
import { PermissionModule } from '~/permission/permission.module';

import { UtilityModule } from '~/utility/utility.module';

import { AppController } from './app.controller';
import { AppInfrastructure } from './app.infra';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  imports: [
    forwardRef(() => UtilityModule),
    PermissionModule,
  ],
  providers: [AppService, AppInfrastructure],
  exports: [AppService, AppInfrastructure],
})
export class AppModule {}
