import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Program } from './program'

@Index('program_announcement_pkey', ['id'], { unique: true })
@Entity('program_announcement', { schema: 'public' })
export class ProgramAnnouncement {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'title' })
  title: string

  @Column('text', { name: 'description' })
  description: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null

  @ManyToOne(() => Program, program => program.programAnnouncements, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'program_id', referencedColumnName: 'id' }])
  program: Program
}
