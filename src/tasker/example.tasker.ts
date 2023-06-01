import { Job } from 'bull';
import { Process, Processor } from '@nestjs/bull';

import { Tasker } from './tasker';

@Processor(ExampleTasker.name)
export class ExampleTasker extends Tasker{
  @Process()
  async process(job: Job<unknown>): Promise<void> {
    console.log(job);
  }
}
