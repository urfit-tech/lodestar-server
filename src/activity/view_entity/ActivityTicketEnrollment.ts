import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'activity_ticket_enrollment',
  expression: `
    CREATE 
    OR REPLACE VIEW public.activity_ticket_enrollment AS 
    SELECT 
      activity_ticket.id AS activity_ticket_id, 
      order_log.id AS order_log_id, 
      order_log.member_id, 
      order_product.id AS order_product_id 
    FROM 
      activity_ticket 
      JOIN order_product ON order_product.product_id = concat(
        'ActivityTicket_', activity_ticket.id
      ) 
      JOIN order_log ON order_product.delivered_at < now() 
      AND order_log.id = order_product.order_id;
  `,
})
export class ActivityTicketEnrollment {
  @ViewColumn({ name: 'activity_ticket_id' })
  activityTicketId: string;

  @ViewColumn({ name: 'order_log_id' })
  orderLogId: number;

  @ViewColumn({ name: 'member_id' })
  memberId: number;

  @ViewColumn({ name: 'order_product_id' })
  orderProductId: number;
}
