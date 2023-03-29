import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { ActivitySession } from './ActivitySession'
import { ActivityTicket } from './ActivityTicket'

@Index(
  'activity_session_ticket_activity_session_id_activity_ticket_id_',
  ['activitySessionId', 'activitySessionType', 'activityTicketId'],
  { unique: true },
)
@Index('activity_session_ticket_pkey', ['id'], { unique: true })
@Entity('activity_session_ticket', { schema: 'public' })
export class ActivitySessionTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid', { name: 'activity_session_id', unique: true })
  activitySessionId: string

  @Column('uuid', { name: 'activity_ticket_id', unique: true })
  activityTicketId: string

  @Column('text', {
    name: 'activity_session_type',
    unique: true,
    default: () => "'offline'",
  })
  activitySessionType: string

  @ManyToOne(() => ActivitySession, activitySession => activitySession.activitySessionTickets, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'activity_session_id', referencedColumnName: 'id' }])
  activitySession: ActivitySession

  @ManyToOne(() => ActivityTicket, activityTicket => activityTicket.activitySessionTickets, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'activity_ticket_id', referencedColumnName: 'id' }])
  activityTicket: ActivityTicket
}
