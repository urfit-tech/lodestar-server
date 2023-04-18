import { Body, Controller, Post } from '@nestjs/common';

import { TriggerService } from './trigger.service';
import { HasuraTrigger } from './trigger.type';

@Controller('trigger')
export class TriggerController {
  constructor(
    private readonly triggerService: TriggerService,
  ) {}

  @Post()
  async handleHasuraTrigger(
    @Body() body: HasuraTrigger,
  ): Promise<void> {
    return this.triggerService.handleHasuraTrigger(body);
  }
}
