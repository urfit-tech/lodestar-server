import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Project } from './Project'
import { ProjectPlanProduct } from './ProjectPlanProduct'

@Index('project_plan_pkey', ['id'], { unique: true })
@Entity('project_plan', { schema: 'public' })
export class ProjectPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'cover_url', nullable: true })
  coverUrl: string | null

  @Column('text', { name: 'title' })
  title: string

  @Column('text', { name: 'description', nullable: true })
  description: string | null

  @Column('numeric', { name: 'list_price', nullable: true })
  listPrice: number | null

  @Column('numeric', { name: 'sale_price', nullable: true })
  salePrice: number | null

  @Column('timestamp with time zone', { name: 'sold_at', nullable: true })
  soldAt: Date | null

  @Column('numeric', { name: 'discount_down_price', default: () => 0 })
  discountDownPrice: number

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('boolean', { name: 'is_subscription', default: () => false })
  isSubscription: boolean

  @Column('numeric', { name: 'period_amount', nullable: true })
  periodAmount: number | null

  @Column('text', { name: 'period_type', nullable: true })
  periodType: string | null

  @Column('integer', { name: 'position', nullable: true })
  position: number | null

  @Column('text', { name: 'deliverables', nullable: true })
  deliverables: string | null

  @Column('boolean', {
    name: 'is_participants_visible',
    default: () => false,
  })
  isParticipantsVisible: boolean

  @Column('boolean', { name: 'is_physical', default: () => false })
  isPhysical: boolean

  @Column('boolean', { name: 'is_limited', default: () => false })
  isLimited: boolean

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null

  @Column('boolean', { name: 'auto_renewed', default: () => false })
  autoRenewed: boolean

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null

  @Column('text', { name: 'currency_id', default: () => "'TWD'" })
  currencyId: string

  @ManyToOne(() => Project, project => project.projectPlans, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'project_id', referencedColumnName: 'id' }])
  project: Project

  @OneToMany(() => ProjectPlanProduct, projectPlanProduct => projectPlanProduct.projectPlan)
  projectPlanProducts: ProjectPlanProduct[]
}
