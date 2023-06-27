import { Logger } from '@nestjs/common';

import { getMemoryUsageString } from '~/utils';

export class Tasker {
  protected readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  protected preProcess(): void {
    this.logger.log(getMemoryUsageString());
  }

  protected postProcess(): void {
    this.logger.log('Task execution finished');
    this.logger.log(getMemoryUsageString());
  }
}
