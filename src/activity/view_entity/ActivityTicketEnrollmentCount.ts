import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'activity_ticket_enrollment_count',
  expression: `
    CREATE 
    OR REPLACE VIEW public.activity_ticket_enrollment_count AS 
    SELECT 
      activity_ticket.id AS activity_ticket_id, 
      activity_ticket.activity_id, 
      activity_ticket.count, 
      CASE WHEN count(order_product.id) = 0 THEN 0 :: bigint ELSE sum(
        COALESCE(
          (
            order_product.options -> 'quantity' :: text
          ):: integer, 
          1
        )
      ) END AS enrollment_count, 
      activity_ticket.count - CASE WHEN count(order_product.id) = 0 THEN 0 :: bigint ELSE sum(
        COALESCE(
          (
            order_product.options -> 'quantity' :: text
          ):: integer, 
          1
        )
      ) END AS buyable_quantity 
    FROM 
      activity_ticket FULL 
      JOIN (
        SELECT 
          order_product_1.id, 
          order_product_1.product_id, 
          order_product_1.options 
        FROM 
          order_product order_product_1 
          JOIN order_log ON order_log.id = order_product_1.order_id 
          AND order_product_1.delivered_at < now() 
          AND order_log.parent_order_id IS NULL
      ) order_product ON order_product.product_id = concat(
        'ActivityTicket_', activity_ticket.id
      ) 
    WHERE 
      activity_ticket.id IS NOT NULL 
    GROUP BY 
      activity_ticket.id, 
      activity_ticket.activity_id;
  `,
})
export class ActivityTicketEnrollmentCount {
  @ViewColumn({ name: 'activity_ticket_id' })
  activityTicketId: string;

  @ViewColumn({ name: 'activity_id' })
  activityId: string;

  @ViewColumn({ name: 'count' })
  count: number;

  @ViewColumn({ name: 'enrollment_count' })
  enrollmentCount: number;

  @ViewColumn({ name: 'buyable_quantity' })
  buyableQuantity: number;
}
