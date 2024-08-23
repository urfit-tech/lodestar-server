import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PaymentInfrastructure } from './payment.infra';

@Injectable()
export class PaymentService {
  constructor(private readonly paymentInfra: PaymentInfrastructure) {}

  async getPaymentByNo(no: string, manager: EntityManager) {
    return this.paymentInfra.getOneByNo(no, manager);
  }
}
