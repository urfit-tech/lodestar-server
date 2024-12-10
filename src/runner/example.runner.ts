import dayjs from 'dayjs';
import { Injectable, Logger } from '@nestjs/common';

import { DistributedLockService } from '~/utility/lock/distributed_lock.service';
import { ShutdownService } from '~/utility/shutdown/shutdown.service';

import { Runner } from './runner';
import { RunnerInfrastructure } from './runner.infra';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

@Injectable()
export class ExampleRunner extends Runner {
  constructor(
    protected readonly logger: Logger,
    protected readonly distributedLockService: DistributedLockService,
    protected readonly shutdownService: ShutdownService,
    protected readonly runnerInfrastructure: RunnerInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {
    super(
      ExampleRunner.name,
      1000,
      logger,
      distributedLockService,
      shutdownService,
      runnerInfrastructure,
      entityManager,
    );
  }

  async execute(): Promise<void> {
    await new Promise((resolve) =>
      setTimeout(() => {
        this.logger.log(`Execute time: ${dayjs().toISOString()}`);
        resolve(undefined);
      }, 500),
    );
  }
}
