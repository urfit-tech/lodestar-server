import { Injectable } from '@nestjs/common';

import { Runner, RunnerType } from './runner';

@Injectable()
export class ExampleRunner extends Runner {
  constructor() {
    super(RunnerType.EXAMPLE_RUNNER, 1000);
  }

  async execute(): Promise<void> {
    await new Promise((resolve) => setTimeout(() => {
      console.log(`Execute time: ${new Date().toISOString()}`);
      resolve(undefined);
    }, 3000));
  }
}
