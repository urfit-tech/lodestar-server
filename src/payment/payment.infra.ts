import { And, EntityManager, Equal, In, IsNull, LessThan, MoreThan, Not, Raw } from 'typeorm';
import { isArray } from 'lodash';
import { Injectable } from '@nestjs/common';

import { PaymentLog } from './payment_log.entity';
import dayjs from 'dayjs';

@Injectable()
export class PaymentInfrastructure {
  async getShouldIssueInvoicePaymentLogs(
    limit: number, manager?: EntityManager,
  ): Promise<Array<PaymentLog>> {
    const paymentLogRepo = manager.getRepository(PaymentLog);
    return paymentLogRepo.find({
      where: {
        price: MoreThan(0),
        status: Equal('SUCCESS'),
        invoiceIssuedAt: IsNull(),
        invoiceOptions: Raw((alias) => `(${alias} ->> 'status' IS NULL OR (${alias} ->> 'status' != 'SUCCESS' AND (${alias} ->> 'retry')::numeric < 5))`),
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
  }

  async getOneByNo(no: string, manager: EntityManager): Promise<PaymentLog> {
    const paymentLogRepo = manager.getRepository(PaymentLog);
    const paymentLog = await paymentLogRepo.findOne({
      where: { no: Equal(no) },
    });
    return paymentLog;
  }

  async save(paymentLogs: PaymentLog | Array<PaymentLog>, manager: EntityManager): Promise<Array<PaymentLog> >{
    const paymentLogRepo = manager.getRepository(PaymentLog);
    return paymentLogRepo.save(isArray(paymentLogs) ? paymentLogs : [paymentLogs]);
  }
}
