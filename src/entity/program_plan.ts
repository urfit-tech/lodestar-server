import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Currency } from './currency';

import { Program } from './program';

@Entity()
export class ProgramPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'int4',
    nullable: false,
    default: 1,
    comment: '1 - subscribe all / 2 - subscribe from now / 3 - all',
  })
  type!: number;

  @OneToOne(() => Program, (p) => p.id)
  @JoinColumn({ name: 'program_id' })
  programId!: string;

  @Column({ type: 'text', nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  gains!: any | null;

  @Column({ name: 'sale_price', type: 'numeric', nullable: true })
  salePrice!: number | null;

  @Column({ name: 'list_price', type: 'numeric', nullable: false })
  listPrice!: number;

  @Column({ name: 'sold_at', type: 'timestamp with time zone', nullable: true })
  soldAt!: Date | null;

  @Column({ name: 'period_type', type: 'text', nullable: true })
  periodType!: string | null;

  @Column({ name: 'started_at', type: 'timestamp with time zone', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'ended_at', type: 'timestamp with time zone', nullable: true })
  endedAt!: Date | null;

  @Column({
    name: 'created_at',
    type: 'timestamp with time zone',
    nullable: false,
    default: 'NOW()',
  })
  createdAt!: Date;

  @Column({
    name: 'discount_down_price',
    type: 'numeric',
    nullable: false,
    default: 0,
  })
  discountDownPrice!: number;

  @OneToOne(() => Currency, (c) => c.id)
  @JoinColumn({ name: 'currency_id' })
  currencyId!: Currency;

  @Column({
    name: 'period_amount',
    type: 'numeric',
    nullable: true,
    default: 1,
  })
  periodAmount!: number | null;

  @Column({
    name: 'auto_renewed',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  autoRenewed!: boolean;

  @Column({
    name: 'is_participants_visible',
    type: 'boolean',
    nullable: false,
    default: true,
  })
  isParticipantsVisible!: boolean;

  @Column({
    name: 'published_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  publishedAt!: Date | null;

  @Column({
    name: 'is_countdown_timer_visible',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  isCountdownTimerVisible!: boolean;
  
  @Column({
    name: 'group_buying_people',
    type: 'numeric',
    nullable: true,
  })
  groupBuyingPeople!: number | null;

  @Column({
    name: 'remind_period_amount',
    type: 'int4',
    nullable: true,
  })
  remindPeriodAmount!: number | null;

  @Column({
    name: 'remind_period_type',
    type: 'text',
    nullable: true,
  })
  remindPeriodType!: string | null;

  @Column({
    name: 'is_primary',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  isPrimary!: boolean;

  @Column({
    name: 'is_deleted',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  isDeleted!: boolean;
}
