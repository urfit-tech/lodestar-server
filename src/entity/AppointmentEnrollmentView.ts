import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity('appointment_enrollment', { schema: 'public' })
export class AppointmentEnrollmentView {
  @ViewColumn({ name: 'appointment_plan_id' })
  appointmentPlanId: string;

  @ViewColumn({ name: 'member_id' })
  memberId: string;

  @ViewColumn({ name: 'started_at' })
  startedAt: Date | null;

  @ViewColumn({ name: 'ended_at' })
  endedAt: Date | null;

  @ViewColumn({ name: 'order_product_id' })
  orderProductId: string;

  @ViewColumn({ name: 'start_url' })
  startUrl?: string;

  @ViewColumn({ name: 'join_url' })
  joinUrl?: string;

  @ViewColumn({ name: 'member_name' })
  memberName?: string;

  @ViewColumn({ name: 'member_email' })
  memberEmail?: string;

  @ViewColumn({ name: 'member_phone' })
  memberPhone?: string;

  @ViewColumn({ name: 'result' })
  result?: string;

  @ViewColumn({ name: 'issue' })
  issue?: string;

  @ViewColumn({ name: 'created_at' })
  createdAt: Date | null;

  @ViewColumn({ name: 'canceled_at' })
  canceledAt?: Date | null;

  @ViewColumn({ name: 'app_id' })
  appId: string;

  @ViewColumn({ name: 'published_at' })
  publishedAt: Date | null;

  @ViewColumn({ name: 'creator_id' })
  creatorId: string;

  @ViewColumn({ name: 'order_product_name' })
  orderProductName: string;

  @ViewColumn({ name: 'order_product_description' })
  order_product_description: string;
}
