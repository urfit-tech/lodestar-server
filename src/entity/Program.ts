import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { App } from '~/app/entity/app.entity';

import { PackageItem } from './PackageItem';
import { ProgramAnnouncement } from './ProgramAnnouncement';
import { ProgramApproval } from './ProgramApproval';
import { ProgramCategory } from './ProgramCategory';
import { ProgramContentSection } from './ProgramContentSection';
import { ProgramPackageProgram } from './ProgramPackageProgram';
import { ProgramPlan } from './ProgramPlan';
import { ProgramRelatedItem } from './ProgramRelatedItem';
import { ProgramRole } from './ProgramRole';
import { ProgramTag } from './ProgramTag';
import { ProgramTimetable } from './ProgramTimetable';

@Index('program_app_id', ['appId'], {})
@Index('program_pkey', ['id'], { unique: true })
@Index('program_is_private', ['isPrivate'], {})
@Index('program_position_published_at_updated_at_index', ['position', 'publishedAt', 'updatedAt'], {})
@Index('program_updated_at_desc', ['updatedAt'], {})
@Entity('program', { schema: 'public' })
export class Program {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'app_id' })
  appId: string;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'abstract', nullable: true })
  abstract: string | null;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('text', { name: 'cover_url', nullable: true })
  coverUrl: string | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null;

  @Column('boolean', { name: 'is_subscription', default: () => false })
  isSubscription: boolean;

  @Column('timestamp with time zone', { name: 'sold_at', nullable: true })
  soldAt: Date | null;

  @Column('numeric', { name: 'list_price', nullable: true })
  listPrice: number | null;

  @Column('numeric', { name: 'sale_price', nullable: true })
  salePrice: number | null;

  @Column('integer', { name: 'position', nullable: true })
  position: number | null;

  @Column('boolean', { name: 'in_advance', default: () => false })
  inAdvance: boolean;

  @Column('text', { name: 'cover_video_url', nullable: true })
  coverVideoUrl: string | null;

  @Column('boolean', { name: 'is_sold_out', nullable: true })
  isSoldOut: boolean | null;

  @Column('jsonb', { name: 'support_locales', nullable: true })
  supportLocales: object | null;

  @Column('boolean', { name: 'is_deleted', default: () => false })
  isDeleted: boolean;

  @Column('boolean', { name: 'is_private', default: () => false })
  isPrivate: boolean;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null;

  @Column('boolean', { name: 'is_issues_open', default: () => true })
  isIssuesOpen: boolean;

  @Column('boolean', {
    name: 'is_countdown_timer_visible',
    default: () => false,
  })
  isCountdownTimerVisible: boolean;

  @Column('boolean', {
    name: 'is_introduction_section_visible',
    default: () => true,
  })
  isIntroductionSectionVisible: boolean;

  @Column('jsonb', { name: 'meta_tag', nullable: true })
  metaTag: object | null;

  @Column('boolean', {
    name: 'is_enrolled_count_visible',
    default: () => true,
  })
  isEnrolledCountVisible: boolean;

  @Column('text', { name: 'cover_mobile_url', nullable: true })
  coverMobileUrl: string | null;

  @Column('text', { name: 'cover_thumbnail_url', nullable: true })
  coverThumbnailUrl: string | null;

  @Column('jsonb', { name: 'metadata', nullable: true })
  metadata: object | null;

  @Column('numeric', { name: 'views', default: () => 0 })
  views: number;

  @OneToMany(() => PackageItem, (packageItem) => packageItem.program)
  packageItems: PackageItem[];

  @ManyToOne(() => App, (app) => app.programs, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App;

  @OneToMany(() => ProgramAnnouncement, (programAnnouncement) => programAnnouncement.program)
  programAnnouncements: ProgramAnnouncement[];

  @OneToMany(() => ProgramApproval, (programApproval) => programApproval.program)
  programApprovals: ProgramApproval[];

  @OneToMany(() => ProgramCategory, (programCategory) => programCategory.program)
  programCategories: ProgramCategory[];

  @OneToMany(() => ProgramContentSection, (programContentSection) => programContentSection.program)
  programContentSections: ProgramContentSection[];

  @OneToMany(() => ProgramPackageProgram, (programPackageProgram) => programPackageProgram.program)
  programPackagePrograms: ProgramPackageProgram[];

  @OneToMany(() => ProgramPlan, (programPlan) => programPlan.program)
  programPlans: ProgramPlan[];

  @OneToMany(() => ProgramRelatedItem, (programRelatedItem) => programRelatedItem.program)
  programRelatedItems: ProgramRelatedItem[];

  @OneToMany(() => ProgramRole, (programRole) => programRole.program)
  programRoles: ProgramRole[];

  @OneToMany(() => ProgramTag, (programTag) => programTag.program)
  programTags: ProgramTag[];

  @OneToMany(() => ProgramTimetable, (programTimetable) => programTimetable.program)
  programTimetables: ProgramTimetable[];
}
