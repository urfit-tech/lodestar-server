import { Module } from '@nestjs/common';

import { AuthModule } from '~/auth/auth.module';

import { OrderController } from './order.controller';
import { OrderInfrastructure } from './order.infra';
import { OrderService } from './order.service';

@Module({
  controllers: [OrderController],
  imports: [AuthModule],
  exports: [OrderInfrastructure],
  providers: [OrderService, OrderInfrastructure],
})
export class OrderModule {}
