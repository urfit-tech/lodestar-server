import { Injectable } from '@nestjs/common/decorators';
import { EntityManager } from 'typeorm';
import { ProgramPlan } from '../entity/ProgramPlan';

@Injectable()
export class ProgramPlanInfrastructure {
  async getProgramPlanById(id: string, manager: EntityManager): Promise<ProgramPlan> {
    return manager.getRepository(ProgramPlan).findOne({ where: { id } });
  }
}
