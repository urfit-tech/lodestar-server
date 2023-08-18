import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Currency } from './Currency';
import { Program } from './Program';
import { ProgramContentPlan } from './ProgramContentPlan';

@Index('program_plan_pkey', ['id'], { unique: true })
@Index('program_plan_program_id', ['programId'], {})
@Entity('program_plan', { schema: 'public' })
export class ProgramPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('integer', { name: 'type', default: () => 1 })
  type: number;

  @Column('uuid', { name: 'program_id' })
  programId: string;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('jsonb', { name: 'gains', nullable: true })
  gains: object | null;

  @Column('numeric', { name: 'sale_price', nullable: true })
  salePrice: number | null;

  @Column('numeric', { name: 'list_price' })
  listPrice: number;

  @Column('timestamp with time zone', { name: 'sold_at', nullable: true })
  soldAt: Date | null;

  @Column('text', { name: 'period_type', nullable: true })
  periodType: string | null;

  @Column('timestamp with time zone', { name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column('timestamp with time zone', { name: 'ended_at', nullable: true })
  endedAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('numeric', { name: 'discount_down_price', default: () => 0 })
  discountDownPrice: number;

  @Column('numeric', {
    name: 'period_amount',
    nullable: true,
    default: () => 1,
  })
  periodAmount: number | null;

  @Column('boolean', { name: 'auto_renewed', default: () => false })
  autoRenewed: boolean;

  @Column('boolean', { name: 'is_participants_visible', default: () => true })
  isParticipantsVisible: boolean;

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null;

  @Column('boolean', {
    name: 'is_countdown_timer_visible',
    default: () => false,
  })
  isCountdownTimerVisible: boolean;

  @Column('numeric', { name: 'group_buying_people', nullable: true })
  groupBuyingPeople: number | null;

  @Column('integer', { name: 'remind_period_amount', nullable: true })
  remindPeriodAmount: number | null;

  @Column('text', { name: 'remind_period_type', nullable: true })
  remindPeriodType: string | null;

  @Column('boolean', { name: 'is_primary', default: () => false })
  isPrimary: boolean;

  @Column('boolean', { name: 'is_deleted', default: () => false })
  isDeleted: boolean;

  @OneToMany(() => ProgramContentPlan, (programContentPlan) => programContentPlan.programPlan)
  programContentPlans: ProgramContentPlan[];

  @ManyToOne(() => Currency, (currency) => currency.programPlans, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'currency_id', referencedColumnName: 'id' }])
  currency: Currency;

  @ManyToOne(() => Program, (program) => program.programPlans, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_id', referencedColumnName: 'id' }])
  program: Program;
}
