import { Job } from 'bull';
import { Process, Processor } from '@nestjs/bull';

@Processor(ExampleTasker.name)
export class ExampleTasker {
  @Process()
  async process(job: Job<unknown>): Promise<void> {
    console.log(job);
  }
}
