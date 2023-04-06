import { Controller, Get } from '@nestjs/common'
import { ApplicationService } from './application.service'

@Controller()
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
  ) {}

  @Get('healthz')
  healthz(): Promise<string> {
    return this.applicationService.healthz();
  }
}
