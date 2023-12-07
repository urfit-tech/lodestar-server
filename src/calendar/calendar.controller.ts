import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { createEvents } from 'ics';

import { APIException } from '~/api.excetion';

import { CalendarService } from './calendar.service';

@Controller({
  path: 'calendars',
  version: '2',
})
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get(':memberId')
  async getCalendarByMemberId(@Param('memberId') memberId: string, @Res() response: Response): Promise<Response> {
    if (!memberId) {
      throw new APIException({ code: 'E_NULL_MEMBER', message: 'memberId is null or undefined' });
    }
    const events = await this.calendarService.getCalendarEventsByMemberId(memberId);
    const eventsResult = createEvents(events);

    response.set({
      'Content-Type': 'text/calendar',
      'Content-Disposition': `attachment; filename="${memberId}.ics"`,
    });
    response.send(eventsResult.value);
    return response;
  }
}
