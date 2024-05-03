import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AppointmentSchedule } from './AppointmentSchedule';
import { Currency } from './Currency';
import { Member } from '~/member/entity/member.entity';

@Index('appointment_plan_pkey', ['id'], { unique: true })
@Entity('appointment_plan', { schema: 'public' })
export class AppointmentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'creator_id' })
  creatorId: string;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('numeric', { name: 'duration' })
  duration: number;

  @Column('numeric', { name: 'price', default: () => 0 })
  price: number;

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

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null;

  @Column('text', { name: 'phone', nullable: true })
  phone: string | null;

  @Column('jsonb', { name: 'support_locales', nullable: true })
  supportLocales: object | null;

  @Column('boolean', { name: 'is_private', default: () => false })
  isPrivate: boolean;

  @Column('numeric', { name: 'reservation_amount', default: () => 0 })
  reservationAmount: number;

  @Column('text', { name: 'reservation_type', nullable: true })
  reservationType: string | null;

  @ManyToOne(() => Member, (member) => member.appointmentPlans, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'creator_id', referencedColumnName: 'id' }])
  creator: Member;

  @ManyToOne(() => Currency, (currency) => currency.appointmentPlans, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'currency_id', referencedColumnName: 'id' }])
  currency: Currency;

  @OneToMany(() => AppointmentSchedule, (appointmentSchedule) => appointmentSchedule.appointmentPlan)
  appointmentSchedules: AppointmentSchedule[];
}
