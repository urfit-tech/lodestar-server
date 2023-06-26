import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { OrderLog } from './entity/order_log.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { TransferReceivedOrderDTO } from './order.type';
import { APIException } from '~/api.excetion';

@Injectable()
export class OrderService {
  constructor(@InjectEntityManager('phdb') private readonly entityManager: EntityManager) {}
  async transferReceivedOrder(dto: TransferReceivedOrderDTO) {
    const OrderLogRepo = this.entityManager.getRepository(OrderLog);
    const { orderId, memberId } = dto;
    if (!memberId) {
      throw new APIException({ code: 'E_NULL_MEMBER', message: 'memberId is null or undefined' });
    }
    if (!orderId) {
      throw new APIException({ code: 'E_NULL_ORDER', message: 'orderId is null or undefined' });
    }
    try {
      const updateResult = await OrderLogRepo.update(orderId, {
        memberId: memberId,
        transferredAt: new Date(),
      });
      return updateResult;
    } catch {
      throw new APIException({ code: 'E_DB_UPDATE', message: 'data update failed' });
    }
  }
}
