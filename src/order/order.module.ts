import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderInfrastructure } from './order.infra';
import { OrderService } from './order.service';

@Module({
  controllers: [OrderController],
  exports: [OrderInfrastructure],
  providers: [OrderService, OrderInfrastructure],
})
export class OrderModule {}
