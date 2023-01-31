import {
  Entity,
  PrimaryColumn,
  Column,
  Check,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { AppPlan } from './app_plan';
import { BaseEntity } from './base';

@Entity()
@Check('(length(symbol) >= 2) AND (length(symbol) <= 3) AND (upper(symbol) = symbol)')
export class App extends BaseEntity {
  @PrimaryColumn({ type: 'text', nullable: false, default: 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'text', nullable: true, default: null })
  name!: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  title!: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  description!: string | null;

  @Column({
    name: 'point_exchange_rate',
    type: 'numeric',
    nullable: true,
    default: 1,
  })
  pointExchangeRate!: number | null;

  @Column({
    name: 'point_discount_ratio',
    type: 'numeric',
    nullable: true,
    default: 0.8,
  })
  pointDiscountRatio!: number | null;

  @Column({
    name: 'point_validity_period',
    type: 'numeric',
    nullable: true,
    default: 7776000,
  })
  pointValidityPeriod!: number | null;

  @Column({
    name: 'vimeo_project_id',
    type: 'text',
    nullable: true,
  })
  vimeoProjectId!: string | null;

  @Column({
    type: 'text',
    nullable: false,
  })
  symbol!: string;

  @OneToOne(() => AppPlan)
  @JoinColumn({
    name: 'app_plan_id',
  })
  appPlanId!: string;

  @Column({
    name: 'started_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  startedAt!: Date | null;

  @Column({
    name: 'ended_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  endedAt!: Date | null;

  @Column({
    name: 'ord_id',
    type: 'text',
    nullable: true,
  })
  orgId!: string | null;
}
