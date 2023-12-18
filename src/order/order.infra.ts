import { EntityManager, Equal, FindOptionsOrder, FindOptionsSelect, FindOptionsWhere } from 'typeorm';
import { isArray } from 'lodash';
import { Injectable } from '@nestjs/common';
import { OrderLog } from './entity/order_log.entity';
import { OrderProduct } from './entity/order_product.entity';
import { OrderDiscount } from './entity/order_discount.entity';

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

  async exportOrderLogsByAppId(
    appId: string,
    manager: EntityManager,
    conditions?: FindOptionsWhere<OrderLog>,
    select?: FindOptionsSelect<OrderLog>,
    order?: FindOptionsOrder<OrderLog>,
  ): Promise<Array<OrderLog>> {
    const orderLogRepo = manager.getRepository(OrderLog);
    const orderLogs = await orderLogRepo.find({
      ...(select && { select }),
      ...(order && { order }),
      where: {
        appId,
        ...conditions,
      },
      relations: {
        member: true,
        orderDiscounts: true,
        orderExecutors: {
          member: true,
        },
        orderProducts: {
          product: true,
        },
        paymentLogs: true,
      },
    });
    return orderLogs;
  }

  async exportOrderProductsByAppId(
    appId: string,
    manager: EntityManager,
    conditions?: FindOptionsWhere<OrderProduct>,
    select?: FindOptionsSelect<OrderProduct>,
    order?: FindOptionsOrder<OrderProduct>,
  ): Promise<Array<OrderProduct>> {
    Object.assign(conditions.order, { appId: Equal(appId) });
    const orderProductRepo = manager.getRepository(OrderProduct);
    const orderProducts = await orderProductRepo.find({
      ...(select && { select }),
      ...(order && { order }),
      where: {
        ...conditions,
      },
      relations: {
        order: true,
        product: true,
      },
    });
    return orderProducts;
  }

  async exportOrderDiscountsByAppId(
    appId: string,
    manager: EntityManager,
    conditions?: FindOptionsWhere<OrderDiscount>,
    select?: FindOptionsSelect<OrderDiscount>,
    order?: FindOptionsOrder<OrderDiscount>,
  ): Promise<Array<OrderDiscount>> {
    Object.assign(conditions.order, { appId: Equal(appId) });
    const orderDiscountRepo = manager.getRepository(OrderDiscount);
    const orderDiscounts = await orderDiscountRepo.find({
      ...(select && { select }),
      ...(order && { order }),
      where: {
        ...conditions,
      },
      relations: {
        order: true,
      },
    });
    return orderDiscounts;
  }

  async getOrderProductsByMemberId(
    memberId: string,
    manager: EntityManager,
    productType?: string,
  ): Promise<Array<OrderProduct>> {
    const orderProductRepo = manager.getRepository(OrderProduct);
    const orderProducts = await orderProductRepo.find({
      where: {
        order: {
          memberId: memberId,
        },
        ...(productType && { product: { type: productType } }),
      },
    });
    return orderProducts;
  }
}
