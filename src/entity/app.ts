import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm'
import { Activity } from './Activity'
import { AppAdmin } from './AppAdmin'
import { AppChannel } from './AppChannel'
import { AppDefaultPermission } from './AppDefaultPermission'
import { AppEmailTemplate } from './AppEmailTemplate'
import { AppExtendedModule } from './AppExtendedModule'
import { AppHost } from './AppHost'
import { AppLanguage } from './AppLanguage'
import { AppNav } from './AppNav'
import { AppPlan } from './AppPlan'
import { AppSecret } from './AppSecret'
import { AppSetting } from './AppSetting'
import { AppUsage } from './AppUsage'
import { AppWebhook } from './AppWebhook'
import { Card } from './Card'
import { CartItem } from './CartItem'
import { Comment } from './Comment'
import { Issue } from './Issue'
import { Member } from './Member'
import { Merchandise } from './Merchandise'
import { Package } from './Package'
import { Podcast } from './Podcast'
import { Post } from './Post'
import { ProductChannel } from './ProductChannel'
import { Program } from './Program'
import { ProgramPackage } from './ProgramPackage'
import { Property } from './Property'
import { SharingCode } from './SharingCode'
import { SmsVerificationCode } from './SmsVerificationCode'
import { VoucherPlan } from './VoucherPlan'

@Index('App_pkey', ['id'], { unique: true })
@Index('app_symbol_key', ['symbol'], { unique: true })
@Entity('app', { schema: 'public' })
export class App {
  @PrimaryColumn()
  id: string

  @Column('text', { name: 'name', nullable: true })
  name: string | null

  @Column('text', { name: 'title', nullable: true })
  title: string | null

  @Column('text', { name: 'description', nullable: true })
  description: string | null

  @Column('numeric', {
    name: 'point_exchange_rate',
    nullable: true,
    default: () => 1,
  })
  pointExchangeRate: number | null

  @Column('numeric', {
    name: 'point_discount_ratio',
    nullable: true,
    default: () => 0.8,
  })
  pointDiscountRatio: number | null

  @Column('numeric', {
    name: 'point_validity_period',
    nullable: true,
    default: () => 7776000,
  })
  pointValidityPeriod: number | null

  @Column('text', { name: 'vimeo_project_id', nullable: true })
  vimeoProjectId: string | null

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null

  @Column('text', { name: 'symbol', unique: true })
  symbol: string

  @Column('timestamp with time zone', { name: 'started_at', nullable: true })
  startedAt: Date | null

  @Column('timestamp with time zone', { name: 'ended_at', nullable: true })
  endedAt: Date | null

  @Column('text', { name: 'org_id', nullable: true })
  orgId: string | null

  @OneToMany(() => Activity, activity => activity.app)
  activities: Activity[]

  @ManyToOne(() => AppPlan, appPlan => appPlan.apps, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_plan_id', referencedColumnName: 'id' }])
  appPlan: AppPlan

  @OneToMany(() => AppAdmin, appAdmin => appAdmin.app)
  appAdmins: AppAdmin[]

  @OneToMany(() => AppChannel, appChannel => appChannel.app)
  appChannels: AppChannel[]

  @OneToMany(() => AppDefaultPermission, appDefaultPermission => appDefaultPermission.app)
  appDefaultPermissions: AppDefaultPermission[]

  @OneToMany(() => AppEmailTemplate, appEmailTemplate => appEmailTemplate.app)
  appEmailTemplates: AppEmailTemplate[]

  @OneToMany(() => AppExtendedModule, appExtendedModule => appExtendedModule.app)
  appExtendedModules: AppExtendedModule[]

  @OneToMany(() => AppHost, appHost => appHost.app)
  appHosts: AppHost[]

  @OneToMany(() => AppLanguage, appLanguage => appLanguage.app)
  appLanguages: AppLanguage[]

  @OneToMany(() => AppNav, appNav => appNav.app)
  appNavs: AppNav[]

  @OneToMany(() => AppSecret, appSecret => appSecret.app)
  appSecrets: AppSecret[]

  @OneToMany(() => AppSetting, appSetting => appSetting.app)
  appSettings: AppSetting[]

  @OneToMany(() => AppUsage, appUsage => appUsage.app)
  appUsages: AppUsage[]

  @OneToMany(() => AppWebhook, appWebhook => appWebhook.app)
  appWebhooks: AppWebhook[]

  @OneToMany(() => Card, card => card.app)
  cards: Card[]

  @OneToMany(() => CartItem, cartItem => cartItem.app)
  cartItems: CartItem[]

  @OneToMany(() => Comment, comment => comment.app)
  comments: Comment[]

  @OneToMany(() => Issue, issue => issue.app)
  issues: Issue[]

  @OneToMany(() => Member, member => member.app)
  members: Member[]

  @OneToMany(() => Merchandise, merchandise => merchandise.app)
  merchandises: Merchandise[]

  @OneToMany(() => Package, pkg => pkg.app)
  packages: Package[]

  @OneToMany(() => Podcast, podcast => podcast.app)
  podcasts: Podcast[]

  @OneToMany(() => Post, post => post.app)
  posts: Post[]

  @OneToMany(() => ProductChannel, productChannel => productChannel.app)
  productChannels: ProductChannel[];

  @OneToMany(() => Program, program => program.app)
  programs: Program[]

  @OneToMany(() => ProgramPackage, programPackage => programPackage.app)
  programPackages: ProgramPackage[]

  @OneToMany(() => Property, property => property.app)
  properties: Property[]

  @OneToMany(() => SharingCode, sharingCode => sharingCode.app)
  sharingCodes: SharingCode[]

  @OneToMany(() => SmsVerificationCode, smsVerificationCode => smsVerificationCode.app)
  smsVerificationCodes: SmsVerificationCode[]

  @OneToMany(() => VoucherPlan, voucherPlan => voucherPlan.app)
  voucherPlans: VoucherPlan[]
}
