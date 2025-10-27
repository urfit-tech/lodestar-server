import { Controller, Post, UseGuards, Body, Ip, ForbiddenException, Get } from '@nestjs/common';
import { TriggerSwitchboardService } from './trigger_switchboard.service';
import { TriggeredEventDTO } from './trigger_switchboard.type';

@Controller({
  path: 'trigger-switchboard',
  version: '2',
})
export class TriggeredSwitchboardController {
  constructor(private readonly triggerSwitchboardService: TriggerSwitchboardService) {}

  @Post('')
  async operate(@Ip() ip: string, @Body() triggeredEventDTO: TriggeredEventDTO) {
    this.triggerSwitchboardService.setTriggeredEventDTO(triggeredEventDTO).setIp(ip);
    if (!this.triggerSwitchboardService.isRequestSourceValid()) {
      throw new ForbiddenException('Invalid IP');
    } else {
      this.triggerSwitchboardService.execute();
    }
  }

  @Get('')
  async listTriggers() {
    const { triggeredEventToTriggerMap, getTriggerFromTriggeredEventName } = TriggerSwitchboardService;
    return triggeredEventToTriggerMap.map(pair => {
      const targetTrigger = getTriggerFromTriggeredEventName(pair.triggeredEventName);
      return {
        trigger_name: pair.triggeredEventName,
        trigger_type: targetTrigger.trigger,
        description: targetTrigger.description,
      };
    });
  }
}
