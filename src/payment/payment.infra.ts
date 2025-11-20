import { And, EntityManager, Equal, In, IsNull, LessThan, MoreThan, Not, Raw } from 'typeorm';
import { isArray } from 'lodash';
import { Injectable } from '@nestjs/common';

import { PaymentLog } from './payment_log.entity';
import { PaymentMethod } from './payment_method.entity';
import dayjs from 'dayjs';

@Injectable()
export class PaymentInfrastructure {
  async getShouldIssueInvoicePaymentLogs(limit: number, manager?: EntityManager): Promise<Array<PaymentLog>> {
    const paymentLogRepo = manager.getRepository(PaymentLog);
    return paymentLogRepo.find({
      where: {
        price: MoreThan(0),
        status: Equal('SUCCESS'),
        invoiceIssuedAt: IsNull(),
        invoiceOptions: Raw(
          alias =>
            `(${alias} ->> 'status' IS NULL OR (${alias} ->> 'status' != 'SUCCESS' AND (${alias} ->> 'retry')::numeric < 5)) AND (${alias} ->'skipIssueInvoice' IS NULL OR ${alias} ->>'skipIssueInvoice' != 'true')`,
        ),
        paidAt: And(LessThan(dayjs.utc().toDate()), MoreThan(dayjs.utc().subtract(3, 'day').toDate())),
        gateway: Not(In(['lodestar', 'manual'])),
      },
      take: limit,
      relations: {
        order: {
          member: true,
          orderProducts: true,
          orderDiscounts: true,
        },
      },
    });
  }

  async getOneByNo(no: string, manager: EntityManager): Promise<PaymentLog> {
    const paymentLogRepo = manager.getRepository(PaymentLog);
    const paymentLog = await paymentLogRepo.findOne({
      where: { no: Equal(no) },
      relations: {
        order: {
          member: true,
          orderProducts: true,
          orderDiscounts: true,
        },
      },
    });
    return paymentLog;
  }

  async save(paymentLogs: PaymentLog | Array<PaymentLog>, manager: EntityManager): Promise<Array<PaymentLog>> {
    const paymentLogRepo = manager.getRepository(PaymentLog);
    return paymentLogRepo.save(isArray(paymentLogs) ? paymentLogs : [paymentLogs]);
  }

  async getPaymentLogsByOrderIds(orderIds: Array<string>, manager: EntityManager): Promise<Array<PaymentLog>> {
    const paymentLogRepo = manager.getRepository(PaymentLog);
    const paymentLogs = await paymentLogRepo.find({
      where: { orderId: In(orderIds) },
    });
    return paymentLogs;
  }

  async getPaymentMethodsByNames(names: Array<string>, manager: EntityManager): Promise<Array<PaymentMethod>> {
    if (!names || names.length === 0) {
      return [];
    }
    const paymentMethodRepo = manager.getRepository(PaymentMethod);
    const paymentMethods = await paymentMethodRepo.find({
      where: { name: In(names) },
    });
    return paymentMethods;
  }

  async getAllPaymentMethods(manager: EntityManager): Promise<Array<PaymentMethod>> {
    const paymentMethodRepo = manager.getRepository(PaymentMethod);
    return paymentMethodRepo.find();
  }
}
