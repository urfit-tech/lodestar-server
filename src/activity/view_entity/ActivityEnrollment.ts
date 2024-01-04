import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'activity_enrollment',
  expression: `
    CREATE 
    OR REPLACE VIEW public.activity_enrollment AS 
    SELECT 
      activity.id AS activity_id, 
      activity_session.id AS activity_session_id, 
      activity_ticket_enrollment.activity_ticket_id, 
      order_log.id AS order_log_id, 
      order_log.invoice_options ->> 'name' :: text AS member_name, 
      order_log.invoice_options ->> 'email' :: text AS member_email, 
      order_log.invoice_options ->> 'phone' :: text AS member_phone, 
      order_log.member_id, 
      activity_attendance.id IS NOT NULL AS attended 
    FROM 
      activity_ticket_enrollment 
      JOIN order_log ON order_log.id = activity_ticket_enrollment.order_log_id 
      JOIN activity_session_ticket ON activity_session_ticket.activity_ticket_id = activity_ticket_enrollment.activity_ticket_id 
      JOIN activity_session ON activity_session.id = activity_session_ticket.activity_session_id 
      JOIN activity ON activity.id = activity_session.activity_id 
      LEFT JOIN activity_attendance ON activity_attendance.order_product_id = activity_ticket_enrollment.order_product_id 
      AND activity_attendance.activity_session_id = activity_session.id;
  `,
})
export class ActivityEnrollment {
  @ViewColumn({ name: 'activity_id' })
  activityId: string;

  @ViewColumn({ name: 'activity_session_id' })
  activitySessionId: number;

  @ViewColumn({ name: 'activity_ticket_id' })
  activityTicketId: number;

  @ViewColumn({ name: 'order_log_id' })
  orderLogId: number;

  @ViewColumn({ name: 'member_name' })
  memberName: string;

  @ViewColumn({ name: 'member_email' })
  memberEmail: string;

  @ViewColumn({ name: 'member_phone' })
  memberPhone: string;

  @ViewColumn({ name: 'member_id' })
  memberId: number;

  @ViewColumn({ name: 'attended' })
  attended: boolean;
}
