import { Module, Logger } from '@nestjs/common';
import { PermissionModule } from '~/permission/permission.module';
import { CacheService } from '~/utility/cache/cache.service';

import { AppController } from './app.controller';
import { AppInfrastructure } from './app.infra';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  imports: [PermissionModule],
  providers: [Logger, AppService, AppInfrastructure, CacheService],
  exports: [AppService, AppInfrastructure],
})
export class AppModule {}
