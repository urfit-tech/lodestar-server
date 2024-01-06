import { Injectable } from '@nestjs/common';
import { EntityManager, LessThan } from 'typeorm';
import { OrderLog } from '~/order/entity/order_log.entity';

@Injectable()
export class AppointmentPlanInfraStructure {
  async getOwnedAppointmentPlan(memberId: string, manager: EntityManager) {
    const appointmentPlans = await manager.getRepository(OrderLog).createQueryBuilder('order_log').select([]).getMany();
  }
}
