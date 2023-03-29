import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Index('exam_pkey', ['id'], { unique: true })
@Entity('exam', { schema: 'public' })
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'abstract', nullable: true })
  abstract: string | null

  @Column('numeric', { name: 'point' })
  point: number

  @Column('numeric', { name: 'passing_score' })
  passingScore: number

  @Column('uuid', { name: 'applicable_plan_id', nullable: true })
  applicablePlanId: string | null

  @Column('text', { name: 'examinable_unit', nullable: true })
  examinableUnit: string | null

  @Column('numeric', { name: 'examinable_amount', nullable: true })
  examinableAmount: number | null

  @Column('timestamp with time zone', {
    name: 'examinable_started_at',
    nullable: true,
  })
  examinableStartedAt: Date | null

  @Column('timestamp with time zone', {
    name: 'examinable_ended_at',
    nullable: true,
  })
  examinableEndedAt: Date | null

  @Column('text', { name: 'time_limit_unit', nullable: true })
  timeLimitUnit: string | null

  @Column('numeric', { name: 'time_limit_amount', nullable: true })
  timeLimitAmount: number | null

  @Column('boolean', { name: 'is_available_to_retry', default: () => false })
  isAvailableToRetry: boolean

  @Column('boolean', {
    name: 'is_available_to_go_back',
    default: () => false,
  })
  isAvailableToGoBack: boolean

  @Column('boolean', {
    name: 'is_available_announce_score',
    default: () => true,
  })
  isAvailableAnnounceScore: boolean

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

  @Column('text', { name: 'app_id' })
  appId: string
}
