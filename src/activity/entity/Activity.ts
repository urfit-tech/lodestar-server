import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { App } from '~/app/entity/app.entity';
import { Member } from '~/member/entity/member.entity';

import { ActivityCategory } from './ActivityCategory';
import { ActivitySession } from './ActivitySession';
import { ActivityTag } from './ActivityTag';
import { ActivityTicket } from './ActivityTicket';
import { PackageItem } from '../../entity/PackageItem';

@Index('activity_pkey', ['id'], { unique: true })
@Entity('activity', { schema: 'public' })
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('boolean', {
    name: 'is_participants_visible',
    default: () => false,
  })
  isParticipantsVisible: boolean;

  @Column('text', { name: 'cover_url', nullable: true })
  coverUrl: string | null;

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null;

  @Column('integer', { name: 'position', nullable: true })
  position: number | null;

  @Column('jsonb', { name: 'support_locales', nullable: true })
  supportLocales: object | null;

  @Column('timestamp with time zone', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null;

  @Column('boolean', { name: 'is_private', default: () => false })
  isPrivate: boolean;

  @Column('text', { name: 'app_id' })
  appId: string;

  @ManyToOne(() => App, (app) => app.activities, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App;

  @ManyToOne(() => Member, (member) => member.activities, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'organizer_id', referencedColumnName: 'id' }])
  organizer: Member;

  @OneToMany(() => ActivityCategory, (activityCategory) => activityCategory.activity)
  activityCategories: ActivityCategory[];

  @OneToMany(() => ActivitySession, (activitySession) => activitySession.activity)
  activitySessions: ActivitySession[];

  @OneToMany(() => ActivityTag, (activityTag) => activityTag.activity)
  activityTags: ActivityTag[];

  @OneToMany(() => ActivityTicket, (activityTicket) => activityTicket.activity)
  activityTickets: ActivityTicket[];

  @OneToMany(() => PackageItem, (packageItem) => packageItem.activity)
  packageItems: PackageItem[];
}
