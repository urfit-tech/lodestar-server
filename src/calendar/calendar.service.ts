import { Injectable } from '@nestjs/common';
import { EventAttributes, convertTimestampToArray } from 'ics';

import { CacheService } from '~/utility/cache/cache.service';
import { MemberService } from '~/member/member.service';
import { AppointmentService } from '~/appointment/appointment.service';

@Injectable()
export class CalendarService {
  private readonly cacheKeyPrefix = 'calendar_';
  constructor(
    private readonly cacheService: CacheService,
    private readonly memberService: MemberService,
    private readonly appointmentService: AppointmentService,
  ) {}

  async getCalendarEventsByMemberId(memberId: string): Promise<EventAttributes[]> {
    const redisCli = this.cacheService.getClient();
    const cachedEvents = await redisCli.get(`${this.cacheKeyPrefix}${memberId}`).then((result) => {
      return JSON.parse(result);
    });
    if (cachedEvents) {
      return cachedEvents;
    }

    const tasks = await this.memberService.getMemberTasksByExecutorId(memberId);
    const taskEvents: EventAttributes[] = tasks.map((task) => {
      return {
        uid: task.id,
        start: convertTimestampToArray(task.dueAt.getTime(), 'local'),
        title: task.title,
        description: task.description || '',
        duration: { minutes: 0 },
      };
    });

    const appointmentEnrollment = await this.appointmentService.getAppointmentEnrollmentByCreatorId(memberId);
    console.log({ appointmentEnrollment });

    const appointmentEvents: EventAttributes[] = appointmentEnrollment.map((appointment) => {
      return {
        uid: appointment.orderProductId,
        start: convertTimestampToArray(appointment.startedAt.getTime(), 'local'),
        end: convertTimestampToArray(appointment.endedAt.getTime(), 'local'),
        title: appointment.orderProductName || '',
        description: appointment.order_product_description || '',
      };
    });

    const events: EventAttributes[] = taskEvents.concat(appointmentEvents);
    redisCli.set(`${this.cacheKeyPrefix}${memberId}`, JSON.stringify(events), 'EX', 3600); // Cache expire in 60 mins.
    return events;
  }
}
