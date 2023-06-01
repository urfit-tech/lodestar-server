import { Job } from 'bull';
import { Process, Processor } from '@nestjs/bull';
import { DynamicModule } from '@nestjs/common';

import { Tasker } from './tasker';

export class MailJob {
  appId: string;
  subject: string;
  to: string[];
  cc: string[];
  bcc: string[];
  content: string;
};

@Processor(MailerTasker.name)
export class MailerTasker extends Tasker {
  static forRoot(): DynamicModule {
    return {
      module: MailerTasker,
      imports: [],
      providers: [],
    };
  }

  @Process()
  process(job: Job<MailJob>) {}
}
