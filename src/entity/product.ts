import { Entity, PrimaryColumn, Column } from 'typeorm';

import { BaseEntity } from './base';

@Entity()
export class Product extends BaseEntity {
  @PrimaryColumn({
    type: 'text',
    nullable: false,
    default: 'gen_random_uuid()',
    comment: '{type}_{target}, ex: Program_123-456, ProgramPlan_123-456',
  })
  id!: string;

  @Column({
    type: 'text',
    nullable: false,
    comment: 'ProgramPlan / ProgramContent / ProgramPackagePlan / ActivityTicket / Card / Merchandise / MerchandiseSpec / ProjectPlan / PodcastProgram / PodcastPlan / AppointmentServicePlan / VoucherPlan',
  })
  type!: string;

  @Column({ type: 'text', nullable: false })
  target!: string;

  @Column({ type: 'text', nullable: true })
  sku!: string | null;

  @Column({
    name: 'coin_back',
    type: 'numeric',
    nullable: false,
    default: 0,
  })
  coinBack!: number;

  @Column({
    name: 'coin_period_amount',
    type: 'int4',
    nullable: true,
  })
  coinPeriodAmount!: number | null;

  @Column({ name: 'coin_period_type', type: 'text', nullable: true })
  coinPeriodType!: string | null;
}
