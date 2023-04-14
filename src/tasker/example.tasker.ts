import { Job } from 'bull';
import { Process, Processor } from '@nestjs/bull';

import { TaskerType } from './tasker';

@Processor(TaskerType.EXAMPLE_TASKER)
export class ExampleTasker {
  @Process()
  async process(job: Job<unknown>): Promise<void> {
    console.log(job);
  }
}
