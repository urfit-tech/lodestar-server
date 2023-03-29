import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Index('certificate_template_pkey', ['id'], { unique: true })
@Entity('certificate_template', { schema: 'public' })
export class CertificateTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'app_id' })
  appId: string

  @Column('text', { name: 'template' })
  template: string

  @Column('text', { name: 'background_image' })
  backgroundImage: string

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

  @Column('timestamp with time zone', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null

  @Column('text', { name: 'title' })
  title: string
}
