import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { AppInfrastructure } from './app.infra';

@Module({
  providers: [AppService, AppInfrastructure],
  exports: [AppService, AppInfrastructure],
})
export class AppModule {}
