import { EntityManager, FindOptionsWhere } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { GiftPlan } from './entity/GiftPlan';

@Injectable()
export class GiftPlanInfrastructure {
  async getGiftPlanById(id: string, manager: EntityManager): Promise<GiftPlan> {
    return manager.getRepository(GiftPlan).findOne({ where: { id } });
  }
}
