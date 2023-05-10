import { Logger } from '@nestjs/common';
import { v4 } from 'uuid';

import { DistributedLockService } from '~/utility/lock/distributed_lock.service';
import { ShutdownService } from '~/utility/shutdown/shutdown.service';

export abstract class Runner {
  public readonly uuid: string;
  protected readonly name: string;
  protected readonly interval: number;
  protected readonly logger: Logger;
  protected readonly lockService: DistributedLockService;
  protected readonly shutdownService: ShutdownService;
  protected previousExecutedTime: Date;

  constructor(
    name: string,
    interval: number,
    logger: Logger,
    lockService: DistributedLockService,
    shutdownService: ShutdownService,
  ) {
    this.uuid = v4();
    this.name = name;
    this.interval = interval;
    this.logger = logger;
    this.lockService = lockService;
    this.shutdownService = shutdownService;
  }

  abstract execute(): Promise<void>;

  async run(): Promise<void> {
    try {
      const suicideTimeout = setTimeout(
        async () => await this.suicide(), this.interval * 1.1,
      );
      await this.lockService.occupyLock(
        this.uuid, new Date().getTime(), this.interval * 2,
      );
      try {
        await this.execute();
      } catch (err) {
        this.logger.error(err);
      }
      await this.lockService.releaseLock(this.uuid);
      clearTimeout(suicideTimeout);
      this.previousExecutedTime = new Date();
    } catch (err) {
      this.logger.error(err);
      this.shutdownService.shutdown();
    }
  }

  async revoke(): Promise<void> {
    try {
      await this.lockService.releaseLock(this.uuid);
    } catch (err) {
      this.logger.error(err);
    }
  }

  getName(): string {
    return this.name;
  }

  getInterval(): number {
    return this.interval;
  }

  getPreviousExecutedTime(): Date {
    return this.previousExecutedTime;
  }

  private async suicide() {
    try {
      this.logger.error('Runner timeout exceed, suicide...');
      await this.lockService.releaseLock(this.uuid);
    } catch (err) {
      this.logger.error(err);
    } finally {
      this.shutdownService.shutdown();
    }
  }
}
