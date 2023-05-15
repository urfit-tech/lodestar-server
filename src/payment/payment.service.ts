import dayjs from 'dayjs';
import { And, EntityManager, Equal, In, IsNull, LessThan, MoreThan, Not } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { PaymentLog } from './payment_log.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectEntityManager('phdb') private readonly entityManager: EntityManager,
  ) {}

  getIssuePaymentLogs(
    limit: number, entityManager?: EntityManager,
  ): Promise<Array<PaymentLog>> {
    const cb = async (manager: EntityManager) => {
      const paymentLogRepo = manager.getRepository(PaymentLog);
      return paymentLogRepo.find({
        where: {
          price: MoreThan(0),
          status: Equal('SUCCESS'),
          invoiceIssuedAt: IsNull(),
          paidAt: And(
            LessThan(dayjs.utc().toDate()),
            MoreThan(dayjs.utc().subtract(3, 'day').toDate()),
          ),
          gateway: Not(In(['lodestar', 'manual'])),
        },
        relations: {
          order: {
            member: true,
            orderProducts: true,
            orderDiscounts: true,
          },
        },
        take: limit,
      });
    };
    return entityManager ? cb(entityManager) : this.entityManager.transaction(cb);
  }
}