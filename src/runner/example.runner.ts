import { Injectable } from '@nestjs/common';

import { DistributeLockService } from '~/utility/lock/distribute_lock.service';

import { Runner } from './runner';
import { RunnerType } from './runner.type';

@Injectable()
export class ExampleRunner extends Runner {
  constructor(
    private readonly distributeLockService: DistributeLockService,
  ) {
    super(RunnerType.EXAMPLE_RUNNER, 1000, distributeLockService);
  }

  async execute(): Promise<void> {
    await new Promise((resolve) => setTimeout(() => {
      console.log(`Execute time: ${new Date().toISOString()}`);
      resolve(undefined);
    }, 3000));
  }
}
