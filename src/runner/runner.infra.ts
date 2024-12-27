import { EntityManager } from 'typeorm/entity-manager/EntityManager';
import { RunnerConfig } from './entity/runner-config.entity';

export class RunnerInfrastructure {
  async getRunnerConfig(runnerName: string, manager: EntityManager): Promise<RunnerConfig> {
    return await manager.getRepository(RunnerConfig).findOne({ where: { runnerName } });
  }
}
