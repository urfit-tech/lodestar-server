import { Injectable, Logger } from '@nestjs/common';

import { DistributedLockService } from '~/utility/lock/distributed_lock.service';
import { ShutdownService } from '~/utility/shutdown/shutdown.service';

import { Runner } from './runner';

@Injectable()
export class ExampleRunner extends Runner {
  constructor(
    protected readonly logger: Logger,
    protected readonly distributedLockService: DistributedLockService,
    protected readonly shutdownService: ShutdownService,
  ) {
    super(
      ExampleRunner.name,
      1000,
      logger,
      distributedLockService,
      shutdownService,
    );
  }

  async execute(): Promise<void> {
    await new Promise((resolve) => setTimeout(() => {
      this.logger.log(`Execute time: ${new Date().toISOString()}`);
      resolve(undefined);
    }, 500));
  }
}
