import { Entity, PrimaryColumn, Column } from 'typeorm';

import { BaseEntity } from './base';

@Entity()
export class AppPlan extends BaseEntity {
  @PrimaryColumn({ type: 'text', nullable: false, default: 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'text', nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: false })
  description!: string;

  @Column({
    name: 'video_duration',
    type: 'numeric',
    nullable: false,
    default: -1,
  })
  videoDuration!: number;

  @Column({
    name: 'watch_seconds',
    type: 'numeric',
    nullable: false,
    default: -1,
  })
  watchSeconds!: number;
}
