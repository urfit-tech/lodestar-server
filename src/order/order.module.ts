import { Module } from '@nestjs/common'

import { OrderInfrastructure } from './order.infra';

@Module({
  providers: [OrderInfrastructure],
  exports: [OrderInfrastructure]
})
export class OrderModule {}
