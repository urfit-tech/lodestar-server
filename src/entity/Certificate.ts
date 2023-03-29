import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Index('certificate_code_app_id_key', ['appId', 'code'], { unique: true })
@Index('certificate_pkey', ['id'], { unique: true })
@Entity('certificate', { schema: 'public' })
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'title' })
  title: string

  @Column('text', { name: 'description', nullable: true })
  description: string | null

  @Column('uuid', { name: 'certificate_template_id', nullable: true })
  certificateTemplateId: string | null

  @Column('text', { name: 'qualification', nullable: true })
  qualification: string | null

  @Column('text', { name: 'period_type', nullable: true })
  periodType: string | null

  @Column('numeric', { name: 'period_amount', nullable: true })
  periodAmount: number | null

  @Column('text', { name: 'author_id' })
  authorId: string

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

  @Column('timestamp with time zone', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null

  @Column('text', { name: 'code', nullable: true, unique: true })
  code: string | null

  @Column('text', { name: 'app_id', unique: true })
  appId: string
}
