import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Program } from './program'

@Index('program_approval_pkey', ['id'], { unique: true })
@Entity('program_approval', { schema: 'public' })
export class ProgramApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string

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

  @Column('text', { name: 'status', default: () => "'pending'" })
  status: string

  @Column('text', { name: 'description', nullable: true })
  description: string | null

  @Column('text', { name: 'feedback', nullable: true })
  feedback: string | null

  @ManyToOne(() => Program, program => program.programApprovals, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_id', referencedColumnName: 'id' }])
  program: Program
}
