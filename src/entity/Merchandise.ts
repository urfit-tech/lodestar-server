import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { App } from './app'
import { Member } from './Member'
import { MemberShop } from './MemberShop'
import { MerchandiseCategory } from './MerchandiseCategory'
import { MerchandiseFile } from './MerchandiseFile'
import { MerchandiseImg } from './MerchandiseImg'
import { MerchandiseSpec } from './MerchandiseSpec'
import { MerchandiseTag } from './MerchandiseTag'
import { PostMerchandise } from './PostMerchandise'

@Index('merchandise_pkey', ['id'], { unique: true })
@Entity('merchandise', { schema: 'public' })
export class Merchandise {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'title' })
  title: string

  @Column('numeric', { name: 'list_price', default: () => 0 })
  listPrice: number

  @Column('text', { name: 'abstract', nullable: true })
  abstract: string | null

  @Column('text', { name: 'description', nullable: true })
  description: string | null

  @Column('text', { name: 'link', nullable: true })
  link: string | null

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null

  @Column('integer', { name: 'position', default: () => -1 })
  position: number

  @Column('boolean', { name: 'is_deleted', default: () => false })
  isDeleted: boolean

  @Column('text', { name: 'meta', nullable: true })
  meta: string | null

  @Column('numeric', { name: 'sale_price', nullable: true })
  salePrice: number | null

  @Column('timestamp with time zone', { name: 'sold_at', nullable: true })
  soldAt: Date | null

  @Column('timestamp with time zone', { name: 'started_at', nullable: true })
  startedAt: Date | null

  @Column('timestamp with time zone', { name: 'ended_at', nullable: true })
  endedAt: Date | null

  @Column('boolean', { name: 'is_physical', default: () => true })
  isPhysical: boolean

  @Column('boolean', { name: 'is_limited', default: () => true })
  isLimited: boolean

  @Column('boolean', { name: 'is_customized', default: () => false })
  isCustomized: boolean

  @Column('boolean', {
    name: 'is_countdown_timer_visible',
    default: () => false,
  })
  isCountdownTimerVisible: boolean

  @Column('text', { name: 'currency_id', default: () => "'TWD'" })
  currencyId: string

  @ManyToOne(() => App, app => app.merchandises, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App

  @ManyToOne(() => Member, member => member.merchandises, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @ManyToOne(() => MemberShop, memberShop => memberShop.merchandises, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_shop_id', referencedColumnName: 'id' }])
  memberShop: MemberShop

  @OneToMany(() => MerchandiseCategory, merchandiseCategory => merchandiseCategory.merchandise)
  merchandiseCategories: MerchandiseCategory[]

  @OneToMany(() => MerchandiseFile, merchandiseFile => merchandiseFile.merchandise)
  merchandiseFiles: MerchandiseFile[]

  @OneToMany(() => MerchandiseImg, merchandiseImg => merchandiseImg.merchandise)
  merchandiseImgs: MerchandiseImg[]

  @OneToMany(() => MerchandiseSpec, merchandiseSpec => merchandiseSpec.merchandise)
  merchandiseSpecs: MerchandiseSpec[]

  @OneToMany(() => MerchandiseTag, merchandiseTag => merchandiseTag.merchandise)
  merchandiseTags: MerchandiseTag[]

  @OneToMany(() => PostMerchandise, postMerchandise => postMerchandise.merchandise)
  postMerchandises: PostMerchandise[]
}
