import { EntityManager, Equal } from 'typeorm';
import { isArray } from 'lodash';
import { Injectable } from '@nestjs/common';

import { OrderLog } from './entity/order_log.entity';

@Injectable()
export class OrderInfrastructure {
  async getManyByPaymentNo(paymentNo: string, manager: EntityManager): Promise<Array<OrderLog>> {
    const orderLogRepo = manager.getRepository(OrderLog);
    const orderLogs = await orderLogRepo.find({
      where: { paymentLogs: { no: Equal(paymentNo) } },
    });
    return orderLogs;
  }

  async save(orderLogs: OrderLog | Array<OrderLog>, manager: EntityManager): Promise<Array<OrderLog>> {
    const orderLogRepo = manager.getRepository(OrderLog);
    return orderLogRepo.save(isArray(orderLogs) ? orderLogs : [orderLogs]);
  }
}
