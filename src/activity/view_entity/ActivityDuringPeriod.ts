import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'activity_during_period',
  expression: `
    CREATE 
    OR REPLACE VIEW public.activity_during_period AS 
    SELECT 
      activity.id AS activity_id, 
      min(activity_session.started_at) AS started_at, 
      max(activity_session.ended_at) AS ended_at 
    FROM 
      activity 
      LEFT JOIN activity_session ON activity.id = activity_session.activity_id 
    WHERE 
      activity.deleted_at IS NULL 
    GROUP BY 
      activity.id;
  `,
})
export class ActivityDuringPeriod {
  @ViewColumn({ name: 'activity_id' })
  activityId: string;

  @ViewColumn({ name: 'started_at' })
  startedAt: Date;

  @ViewColumn({ name: 'ended_at' })
  endedAt: Date;
}
