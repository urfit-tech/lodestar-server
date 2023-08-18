import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AppointmentPlan } from './AppointmentPlan';

@Index('appointment_schedule_pkey', ['id'], { unique: true })
@Entity('appointment_schedule', { schema: 'public' })
export class AppointmentSchedule {
  @Column('uuid', {
    primary: true,
    name: 'id',
    default: () => 'gen_random_uuid()',
  })
  id: string;

  @Column('timestamp with time zone', { name: 'started_at' })
  startedAt: Date;

  @Column('text', { name: 'interval_type', nullable: true })
  intervalType: string | null;

  @Column('integer', { name: 'interval_amount', nullable: true })
  intervalAmount: number | null;

  @Column('jsonb', { name: 'excludes', default: () => 'jsonb_build_array()' })
  excludes: object;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @ManyToOne(() => AppointmentPlan, (appointmentPlan) => appointmentPlan.appointmentSchedules, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'appointment_plan_id', referencedColumnName: 'id' }])
  appointmentPlan: AppointmentPlan;
}
