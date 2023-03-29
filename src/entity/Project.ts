import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { ProjectCategory } from './ProjectCategory'
import { ProjectPlan } from './ProjectPlan'
import { ProjectRole } from './ProjectRole'
import { ProjectSection } from './ProjectSection'

@Index('project_pkey', ['id'], { unique: true })
@Entity('project', { schema: 'public' })
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'type' })
  type: string

  @Column('text', { name: 'title' })
  title: string

  @Column('text', { name: 'abstract', nullable: true })
  abstract: string | null

  @Column('text', { name: 'description', nullable: true })
  description: string | null

  @Column('numeric', { name: 'target_amount', nullable: true })
  targetAmount: number | null

  @Column('text', { name: 'introduction', nullable: true })
  introduction: string | null

  @Column('jsonb', { name: 'updates', nullable: true })
  updates: object | null

  @Column('jsonb', { name: 'comments', nullable: true })
  comments: object | null

  @Column('jsonb', { name: 'contents', nullable: true })
  contents: object | null

  @Column('text', { name: 'cover_type', default: () => "'image'" })
  coverType: string

  @Column('text', { name: 'cover_url', nullable: true })
  coverUrl: string | null

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null

  @Column('timestamp with time zone', { name: 'expired_at', nullable: true })
  expiredAt: Date | null

  @Column('text', { name: 'template', nullable: true })
  template: string | null

  @Column('text', { name: 'app_id' })
  appId: string

  @Column('boolean', {
    name: 'is_participants_visible',
    default: () => false,
  })
  isParticipantsVisible: boolean

  @Column('boolean', {
    name: 'is_countdown_timer_visible',
    default: () => false,
  })
  isCountdownTimerVisible: boolean

  @Column('text', { name: 'preview_url', nullable: true })
  previewUrl: string | null

  @Column('integer', { name: 'position', default: () => -1 })
  position: number

  @Column('text', { name: 'creator_id', nullable: true })
  creatorId: string | null

  @Column('text', { name: 'target_unit', default: () => "'funds'" })
  targetUnit: string

  @Column('text', { name: 'introduction_desktop', nullable: true })
  introductionDesktop: string | null

  @Column('numeric', { name: 'views', default: () => 0 })
  views: number

  @OneToMany(() => ProjectCategory, projectCategory => projectCategory.project)
  projectCategories: ProjectCategory[]

  @OneToMany(() => ProjectPlan, projectPlan => projectPlan.project)
  projectPlans: ProjectPlan[]

  @OneToMany(() => ProjectRole, projectRole => projectRole.project)
  projectRoles: ProjectRole[]

  @OneToMany(() => ProjectSection, projectSection => projectSection.project)
  projectSections: ProjectSection[]
}
