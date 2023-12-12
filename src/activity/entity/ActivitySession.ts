import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Activity } from './Activity';
import { ActivityAttendance } from './ActivityAttendance';
import { ActivitySessionTicket } from './ActivitySessionTicket';

@Index('activity_session_pkey', ['id'], { unique: true })
@Entity('activity_session', { schema: 'public' })
export class ActivitySession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('timestamp with time zone', { name: 'started_at' })
  startedAt: Date;

  @Column('timestamp with time zone', { name: 'ended_at' })
  endedAt: Date;

  @Column('text', { name: 'location', nullable: true })
  location: string | null;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('numeric', { name: 'threshold', nullable: true })
  threshold: number | null;

  @Column('text', { name: 'online_link', nullable: true })
  onlineLink: string | null;

  @Column('timestamp with time zone', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column('text', { name: 'activity_id' })
  activityId: string;

  @OneToMany(() => ActivityAttendance, (activityAttendance) => activityAttendance.activitySession)
  activityAttendances: ActivityAttendance[];

  @ManyToOne(() => Activity, (activity) => activity.activitySessions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'activity_id', referencedColumnName: 'id' }])
  activity: Activity;

  @OneToMany(() => ActivitySessionTicket, (activitySessionTicket) => activitySessionTicket.activitySession)
  activitySessionTickets: ActivitySessionTicket[];
}
