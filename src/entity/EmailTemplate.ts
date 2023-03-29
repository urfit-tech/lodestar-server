import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { AppEmailTemplate } from './AppEmailTemplate'

@Index('email_template_pkey', ['id'], { unique: true })
@Entity('email_template', { schema: 'public' })
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'name' })
  name: string

  @Column('text', { name: 'description' })
  description: string

  @Column('text', { name: 'content' })
  content: string

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

  @OneToMany(() => AppEmailTemplate, appEmailTemplate => appEmailTemplate.emailTemplate)
  appEmailTemplates: AppEmailTemplate[]
}
