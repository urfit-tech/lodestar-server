import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';

import { Activity } from '~/entity/Activity';
import { AppAdmin } from '~/entity/AppAdmin';
import { AppChannel } from '~/entity/AppChannel';
import { AppDefaultPermission } from '~/entity/AppDefaultPermission';
import { AppEmailTemplate } from '~/entity/AppEmailTemplate';
import { AppExtendedModule } from '~/entity/AppExtendedModule';
import { AppLanguage } from '~/entity/AppLanguage';
import { AppNav } from '~/entity/AppNav';
import { AppPlan } from '~/entity/AppPlan';
import { AppUsage } from '~/entity/AppUsage';
import { AppWebhook } from '~/entity/AppWebhook';
import { Card } from '~/entity/Card';
import { CartItem } from '~/entity/CartItem';
import { Comment } from '~/entity/Comment';
import { Issue } from '~/entity/Issue';
import { Merchandise } from '~/entity/Merchandise';
import { Package } from '~/entity/Package';
import { Podcast } from '~/entity/Podcast';
import { Post } from '~/entity/Post';
import { ProductChannel } from '~/entity/ProductChannel';
import { Program } from '~/entity/Program';
import { ProgramPackage } from '~/entity/ProgramPackage';
import { SharingCode } from '~/entity/SharingCode';
import { SmsVerificationCode } from '~/entity/SmsVerificationCode';
import { VoucherPlan } from '~/entity/VoucherPlan';
import { Member } from '~/member/entity/member.entity';
import { Property } from '~/definition/entity/property.entity';
import { Report } from '~/report/entity/report.entity';

import { AppHost } from './app_host.entity';
import { AppSecret } from './app_secret.entity';
import { AppSetting } from './app_setting.entity';

@Index('App_pkey', ['id'], { unique: true })
@Index('app_symbol_key', ['symbol'], { unique: true })
@Entity('app', { schema: 'public' })
export class App {
  @PrimaryColumn()
  id: string;

  @Column('text', { name: 'name', nullable: true })
  name: string | null;

  @Column('text', { name: 'title', nullable: true })
  title: string | null;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('numeric', {
    name: 'point_exchange_rate',
    nullable: true,
    default: () => 1,
  })
  pointExchangeRate: number | null;

  @Column('numeric', {
    name: 'point_discount_ratio',
    nullable: true,
    default: () => 0.8,
  })
  pointDiscountRatio: number | null;

  @Column('numeric', {
    name: 'point_validity_period',
    nullable: true,
    default: () => 7776000,
  })
  pointValidityPeriod: number | null;

  @Column('text', { name: 'vimeo_project_id', nullable: true })
  vimeoProjectId: string | null;

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

  @Column('text', { name: 'symbol', unique: true })
  symbol: string;

  @Column('timestamp with time zone', { name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column('timestamp with time zone', { name: 'ended_at', nullable: true })
  endedAt: Date | null;

  @Column('text', { name: 'org_id', nullable: true })
  orgId: string | null;

  @OneToMany(() => Activity, (activity) => activity.app)
  activities: Activity[];

  @ManyToOne(() => AppPlan, (appPlan) => appPlan.apps, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_plan_id', referencedColumnName: 'id' }])
  appPlan: AppPlan;

  @OneToMany(() => AppAdmin, (appAdmin) => appAdmin.app)
  appAdmins: AppAdmin[];

  @OneToMany(() => AppChannel, (appChannel) => appChannel.app)
  appChannels: AppChannel[];

  @OneToMany(() => AppDefaultPermission, (appDefaultPermission) => appDefaultPermission.app)
  appDefaultPermissions: AppDefaultPermission[];

  @OneToMany(() => AppEmailTemplate, (appEmailTemplate) => appEmailTemplate.app)
  appEmailTemplates: AppEmailTemplate[];

  @OneToMany(() => AppExtendedModule, (appExtendedModule) => appExtendedModule.app)
  appExtendedModules: AppExtendedModule[];

  @OneToMany(() => AppHost, (appHost) => appHost.app)
  appHosts: AppHost[];

  @OneToMany(() => AppLanguage, (appLanguage) => appLanguage.app)
  appLanguages: AppLanguage[];

  @OneToMany(() => AppNav, (appNav) => appNav.app)
  appNavs: AppNav[];

  @OneToMany(() => AppSecret, (appSecret) => appSecret.app)
  appSecrets: AppSecret[];

  @OneToMany(() => AppSetting, (appSetting) => appSetting.app)
  appSettings: AppSetting[];

  @OneToMany(() => AppUsage, (appUsage) => appUsage.app)
  appUsages: AppUsage[];

  @OneToMany(() => AppWebhook, (appWebhook) => appWebhook.app)
  appWebhooks: AppWebhook[];

  @OneToMany(() => Card, (card) => card.app)
  cards: Card[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.app)
  cartItems: CartItem[];

  @OneToMany(() => Comment, (comment) => comment.app)
  comments: Comment[];

  @OneToMany(() => Issue, (issue) => issue.app)
  issues: Issue[];

  @OneToMany(() => Member, (member) => member.app)
  members: Member[];

  @OneToMany(() => Merchandise, (merchandise) => merchandise.app)
  merchandises: Merchandise[];

  @OneToMany(() => Package, (pkg) => pkg.app)
  packages: Package[];

  @OneToMany(() => Podcast, (podcast) => podcast.app)
  podcasts: Podcast[];

  @OneToMany(() => Post, (post) => post.app)
  posts: Post[];

  @OneToMany(() => ProductChannel, (productChannel) => productChannel.app)
  productChannels: ProductChannel[];

  @OneToMany(() => Program, (program) => program.app)
  programs: Program[];

  @OneToMany(() => ProgramPackage, (programPackage) => programPackage.app)
  programPackages: ProgramPackage[];

  @OneToMany(() => Property, (property) => property.app)
  properties: Property[];

  @OneToMany(() => SharingCode, (sharingCode) => sharingCode.app)
  sharingCodes: SharingCode[];

  @OneToMany(() => SmsVerificationCode, (smsVerificationCode) => smsVerificationCode.app)
  smsVerificationCodes: SmsVerificationCode[];

  @OneToMany(() => VoucherPlan, (voucherPlan) => voucherPlan.app)
  voucherPlans: VoucherPlan[];

  @OneToMany(() => Report, (report) => report.app)
  reports: Report[];
}
