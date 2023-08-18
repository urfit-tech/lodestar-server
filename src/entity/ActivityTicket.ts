import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Activity } from './Activity';
import { ActivitySessionTicket } from './ActivitySessionTicket';

@Index('activity_ticket_pkey', ['id'], { unique: true })
@Entity('activity_ticket', { schema: 'public' })
export class ActivityTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('timestamp with time zone', { name: 'started_at' })
  startedAt: Date;

  @Column('timestamp with time zone', { name: 'ended_at' })
  endedAt: Date;

  @Column('numeric', { name: 'price' })
  price: number;

  @Column('integer', { name: 'count' })
  count: number;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('boolean', { name: 'is_published' })
  isPublished: boolean;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'currency_id', default: () => "'TWD'" })
  currencyId: string;

  @Column('timestamp with time zone', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => ActivitySessionTicket, (activitySessionTicket) => activitySessionTicket.activityTicket)
  activitySessionTickets: ActivitySessionTicket[];

  @ManyToOne(() => Activity, (activity) => activity.activityTickets, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'activity_id', referencedColumnName: 'id' }])
  activity: Activity;
}
