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
    let isCompleted = false;
    try {
      await this.lockService.occupyLock(
        this.uuid, new Date().getTime(), this.interval * 2,
      );

      const suicideTimeout = setTimeout(
        () => !isCompleted && this.suicide(),
        this.interval * 1.1,
      );

      try {
        await this.execute();
        isCompleted = true;
      } catch (err) {
        this.logger.error(err);
      }
      await this.lockService.releaseLock(this.uuid);
      clearTimeout(suicideTimeout);
      this.previousExecutedTime = new Date();
    } catch {
      return;
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
      this.logger.error(`SuicideError: ${err}`);
    } finally {
      this.logger.error(`Shutdown ${this.uuid}`);
      this.shutdownService.shutdown();
    }
  }
}
