import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '~/auth/auth.module';
import { MerchandiseSpecController } from './merchandise-spec/merchandise-spec.controller';
import { MerchandiseSpecService } from './merchandise-spec/merchandise-spec.service';
import { MerchandiseSpecInfrastructure } from './merchandise-spec/merchandise-spec.infra';
import { UtilityModule } from '~/utility/utility.module';

@Module({
  controllers: [MerchandiseSpecController],
  imports: [forwardRef(() => AuthModule), UtilityModule],
  providers: [MerchandiseSpecService, MerchandiseSpecInfrastructure],
})
export class MerchandiseModule {}
