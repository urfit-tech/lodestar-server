import { Injectable, Logger } from '@nestjs/common';

import { ShutdownService } from '~/utility/shutdown/shutdown.service';
import { DistributedLockService } from '~/utility/lock/distributed_lock.service';

import { Runner } from './runner';

@Injectable()
export class InvoiceRunner extends Runner {
  private readonly batchSize: number;

  constructor(
    protected readonly logger: Logger,
    protected readonly distributedLockService: DistributedLockService,
    protected readonly shutdownService: ShutdownService,
  ) {
    super(
      InvoiceRunner.name,
      5 * 60 * 1000,
      logger,
      distributedLockService,
      shutdownService,
    );
    this.batchSize = 200;
  }

  async execute(): Promise<void> {}
}