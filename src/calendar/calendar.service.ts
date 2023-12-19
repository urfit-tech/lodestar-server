import { Injectable } from '@nestjs/common';
import { EventAttributes, convertTimestampToArray } from 'ics';

import { CacheService } from '~/utility/cache/cache.service';
import { MemberService } from '~/member/member.service';
import { OrderService } from '~/order/order.service';

@Injectable()
export class CalendarService {
  private readonly cacheKeyPrefix = 'calendar_';
  constructor(
    private readonly cacheService: CacheService,
    private readonly memberService: MemberService,
    private readonly orderService: OrderService,
  ) {}

  async getCalendarEventsByMemberId(memberId: string): Promise<EventAttributes[]> {
    const redisCli = this.cacheService.getClient();
    const cachedEvents = await redisCli.get(`${this.cacheKeyPrefix}${memberId}`).then((result) => {
      return JSON.parse(result);
    });
    if (cachedEvents) {
      return cachedEvents;
    }

    const tasks = await this.memberService.getMemberTasks(memberId);
    const taskEvents: EventAttributes[] = tasks.map((task) => {
      return {
        uid: task.id,
        start: convertTimestampToArray(task.dueAt.getTime(), 'local'),
        title: task.title,
        description: task.description || '',
        duration: { minutes: 0 },
      };
    });

    const orderProducts = await this.orderService.getOrderProductsByMemberId(memberId, 'AppointmentPlan');
    const orderProductEvents: EventAttributes[] = orderProducts.map((orderProduct) => {
      return {
        uid: orderProduct.id,
        start: convertTimestampToArray(orderProduct.startedAt.getTime(), 'local'),
        end: convertTimestampToArray(orderProduct.endedAt.getTime(), 'local'),
        title: orderProduct.name,
        description: orderProduct.description || '',
      };
    });

    const events: EventAttributes[] = taskEvents.concat(orderProductEvents);
    redisCli.set(`${this.cacheKeyPrefix}${memberId}`, JSON.stringify(events), 'EX', 3600); // Cache expire in 60 mins.
    return events;
  }
}
