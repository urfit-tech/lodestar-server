import { Controller, Post, Body, Ip, ForbiddenException, Get, UseGuards, Headers } from '@nestjs/common';
import { TriggerSwitchboardService } from './trigger_switchboard.service';
import { TriggeredEventDTO } from './trigger_switchboard.type';
import { AuthGuard } from '~/auth/auth.guard';
import { AuthService } from '~/auth/auth.service';

@Controller({
  path: 'trigger-switchboard',
  version: '2',
})
export class TriggeredSwitchboardController {
  constructor(
    private readonly triggerSwitchboardService: TriggerSwitchboardService,
    private readonly authService: AuthService,
  ) {}

  @Post('')
  async operate(@Ip() ip: string, @Body() triggeredEventDTO: TriggeredEventDTO) {
    return await this.triggerSwitchboardService.tryCatchWithLog(async () => {
      this.triggerSwitchboardService.setTriggeredEventDTO(triggeredEventDTO).setIp(ip);
      if (!this.triggerSwitchboardService.isRequestSourceValid()) {
        throw new ForbiddenException('Invalid IP');
      } else {
        return await this.triggerSwitchboardService.execute();
      }
    });
  }

  @UseGuards(AuthGuard)
  @Post('outsourcing')
  async outsourcing(@Body() triggeredEventDTO: TriggeredEventDTO, @Headers('Authorization') authorization?: string) {
    return await this.triggerSwitchboardService.tryCatchWithLog(async () => {
      const [_, token] = authorization ? authorization.split(' ') : [undefined, undefined];
      const member = this.authService.verify(token);
      const adaptedTriggeredEventDTO = {
        ...triggeredEventDTO,
        event: { ...triggeredEventDTO?.event, data: { ...triggeredEventDTO?.event?.data, member } },
      };
      this.triggerSwitchboardService.setTriggeredEventDTO(adaptedTriggeredEventDTO);
      return await this.triggerSwitchboardService.execute();
    });
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
