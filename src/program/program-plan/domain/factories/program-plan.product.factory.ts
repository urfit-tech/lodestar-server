import { Injectable } from '@nestjs/common';
import { ProgramPlanInfrastructure } from '../../program-plan.infra';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';

@Injectable()
export class ProgramPlanProductFactory {
  constructor(
    private programPlanInfra: ProgramPlanInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}
  create(id: string) {
    const programPlan = this.programPlanInfra.getProgramPlanById(id, this.entityManager);
  }
}
