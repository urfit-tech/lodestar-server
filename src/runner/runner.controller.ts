import { Controller, Get } from '@nestjs/common';

import { RunnerService } from './runner.service';

@Controller('runner')
export class RunnerController {
  constructor(
    private readonly runnerService: RunnerService,
  ) {}

  @Get('healthz')
  healthz(): Promise<string> {
    return this.runnerService.healthz();
  }  
}
