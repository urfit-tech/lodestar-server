import { Injectable } from '@nestjs/common';

import { DistributedLockService } from '~/utility/lock/distributed_lock.service';

import { Runner } from './runner';

@Injectable()
export class ExampleRunner extends Runner {
  constructor(
    private readonly distributedLockService: DistributedLockService,
  ) {
    super(ExampleRunner.name, 1000, distributedLockService);
  }

  async execute(): Promise<void> {
    await new Promise((resolve) => setTimeout(() => {
      console.log(`Execute time: ${new Date().toISOString()}`);
      resolve(undefined);
    }, 3000));
  }
}
