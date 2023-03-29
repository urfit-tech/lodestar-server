import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Index('audit_log_pkey', ['id'], { unique: true })
@Entity('audit_log', { schema: 'public' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'member_id', nullable: true })
  memberId: string | null

  @Column('text', { name: 'type', nullable: true })
  type: string | null

  @Column('text', { name: 'target', nullable: true })
  target: string | null

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null
}
