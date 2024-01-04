import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'activity_session_ticket_enrollment_count',
  expression: `
    CREATE 
    OR REPLACE VIEW public.activity_session_ticket_enrollment_count AS 
    SELECT 
      t.activity_id, 
      t.activity_session_id, 
      sum(
        t.activity_offline_session_ticket_count
      ) AS activity_offline_session_ticket_count, 
      sum(
        t.activity_online_session_ticket_count
      ) AS activity_online_session_ticket_count 
    FROM 
      (
        SELECT 
          activity_ticket.activity_id, 
          activity_session_ticket.activity_session_id, 
          CASE WHEN activity_session_ticket.activity_session_type = 'offline' :: text THEN count(activity_ticket.id) ELSE 0 :: bigint END AS activity_offline_session_ticket_count, 
          CASE WHEN activity_session_ticket.activity_session_type = 'online' :: text THEN count(activity_ticket.id) ELSE 0 :: bigint END AS activity_online_session_ticket_count 
        FROM 
          order_product 
          JOIN activity_ticket ON order_product.product_id = concat(
            'ActivityTicket_', activity_ticket.id
          ) 
          AND order_product.delivered_at < now() 
          JOIN activity_session_ticket ON activity_session_ticket.activity_ticket_id = activity_ticket.id 
        GROUP BY 
          activity_ticket.activity_id, 
          activity_session_ticket.activity_session_id, 
          activity_session_ticket.activity_session_type
      ) t 
    GROUP BY 
      t.activity_id, 
      t.activity_session_id;
  `,
})
export class ActivitySessionTicketEnrollmentCount {
  @ViewColumn({ name: 'activity_id' })
  activityId: string;

  @ViewColumn({ name: 'activity_session_id' })
  activitySessionId: number;

  @ViewColumn({ name: 'activity_offline_session_ticket_count' })
  activityOfflineSessionTicketCount: number;

  @ViewColumn({ name: 'activity_online_session_ticket_count' })
  activityOnlineSessionTicketCount: number;
}
