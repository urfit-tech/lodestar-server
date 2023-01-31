import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  Column,
} from 'typeorm';

import { App } from './app';
import { BaseEntity } from './base';

@Entity()
export class Program extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => App, (a) => a.id)
  @JoinColumn({ name: 'app_id' })
  appId!: string;

  @Column({ type: 'text', nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: true })
  abstract!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    name: 'cover_url',
    type: 'text',
    nullable: true,
  })
  coverUrl!: string | null;

  @Column({
    name: 'published_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  publishedAt!: Date | null;

  @Column({
    name: 'is_subscription',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  isSubscription!: boolean;

  @Column({
    name: 'sold_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  soldAt!: Date | null;

  @Column({
    name: 'list_price',
    type: 'numeric',
    nullable: true,
  })
  listPrice!: number | null;

  @Column({
    name: 'sale_price',
    type: 'numeric',
    nullable: true,
  })
  salePrice!: number | null;

  @Column({
    name: 'position',
    type: 'int4',
    nullable: true,
  })
  position!: number | null;

  @Column({
    name: 'in_advance',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  inAdvance!: boolean;

  @Column({
    name: 'cover_video_url',
    type: 'text',
    nullable: true,
  })
  coverVideoUrl!: string | null;

  @Column({
    name: 'is_sold_out',
    type: 'boolean',
    nullable: true,
  })
  isSoldOut!: boolean;

  @Column({
    name: 'support_locales',
    type: 'jsonb',
    nullable: true,
  })
  supportLocales!: any | null;

  @Column({
    name: 'is_deleted',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  isDeleted!: boolean;

  @Column({
    name: 'is_private',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  isPrivate!: boolean;

  @Column({
    name: 'is_issues_open',
    type: 'boolean',
    nullable: false,
    default: true,
  })
  isIssuesOpen!: boolean;

  @Column({
    name: 'is_countdown_timer_visible',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  isCountdownTimerVisible!: boolean;

  @Column({
    name: 'is_introduction_section_visible',
    type: 'boolean',
    nullable: false,
    default: true,
  })
  isIntroductionSectionVisible!: boolean;

  @Column({
    name: 'meta_tag',
    type: 'jsonb',
    nullable: true,
  })
  metaTag!: any | null;

  @Column({
    name: 'is_enrolled_count_visible',
    type: 'boolean',
    nullable: false,
    default: true,
  })
  isEnrolledCountVisible!: boolean;

  @Column({
    name: 'cover_mobile_url',
    type: 'text',
    nullable: true,
  })
  coverMobileUrl!: string | null;

  @Column({
    name: 'cover_thumbnail_url',
    type: 'text',
    nullable: true,
  })
  coverThumbnailUrl!: string | null;

  @Column({
    name: 'metadata',
    type: 'jsonb',
    nullable: true,
  })
  metadata!: any | null;

  @Column({
    name: 'views',
    type: 'numeric',
    nullable: false,
    default: 0,
  })
  views!: number | null;
}
