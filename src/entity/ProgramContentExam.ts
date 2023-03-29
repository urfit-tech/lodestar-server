import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Index('program_content_exam_pkey', ['id'], { unique: true })
@Entity('program_content_exam', { schema: 'public' })
export class ProgramContentExam {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid', { name: 'program_content_id' })
  programContentId: string

  @Column('uuid', { name: 'exam_id' })
  examId: string

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
}
