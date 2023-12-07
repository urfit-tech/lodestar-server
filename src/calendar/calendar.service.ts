import { Injectable } from '@nestjs/common';
import { EventAttributes } from 'ics';

import { MemberService } from '~/member/member.service';
import { OrderService } from '~/order/order.service';

@Injectable()
export class CalendarService {
  constructor(private readonly memberService: MemberService, private readonly orderService: OrderService) {}

  async getCalendarEventsByMemberId(memberId: string): Promise<EventAttributes[]> {
    const tasks = await this.memberService.getMemberTasks(memberId);
    const taskEvents: EventAttributes[] = tasks.map((task) => {
      return {
        start: this.dateToIcsDateArray(task.dueAt),
        title: task.title,
        description: task.description || '',
        duration: { minutes: 0 },
      };
    });

    const orderProducts = await this.orderService.getOrderProductsByMemberId(memberId, 'AppointmentPlan');
    const orderProductEvents: EventAttributes[] = orderProducts.map((orderProduct) => {
      return {
        start: this.dateToIcsDateArray(orderProduct.startedAt),
        end: this.dateToIcsDateArray(orderProduct.endedAt),
        title: orderProduct.name,
        description: orderProduct.description || '',
      };
    });

    const events: EventAttributes[] = taskEvents.concat(orderProductEvents);
    return events;
  }

  private dateToIcsDateArray(date: Date): [number, number, number, number, number] {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()];
  }
}
