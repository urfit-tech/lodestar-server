import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { createEvents, EventAttributes } from 'ics';

import { APIException } from '~/api.excetion';

@Controller({
  path: 'calendars',
  version: '2',
})
export class CalendarController {
  @Get(':memberId')
  getCalendarFileByMemberId(@Param('memberId') memberId: string, @Res() response: Response): Response {
    if (!memberId) {
      throw new APIException({ code: 'E_NULL_MEMBER', message: 'memberId is null or undefined' });
    }

    // TODO: Replace dummy events with database record
    const evnets: EventAttributes[] = [
      {
        start: [2024, 1, 1, 8, 0],
        duration: { minutes: 0 },
        title: 'Happy New Year',
        description: 'This is description',
      },
    ];
    const result = createEvents(evnets);

    response.set({
      'Content-Type': 'text/calendar',
      'Content-Disposition': `attachment; filename="${memberId}.ics"`,
    });
    response.send(result.value);
    return response;
  }
}
