import { Module } from '@nestjs/common';
import { SwaggerConfigService } from './swagger-config.service';

@Module({
  providers: [SwaggerConfigService],
})
export class SwaggerConfigModule {}
