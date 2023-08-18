import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('exam_question_group_pkey', ['id'], { unique: true })
@Entity('exam_question_group', { schema: 'public' })
export class ExamQuestionGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'exam_id' })
  examId: string;

  @Column('uuid', { name: 'question_group_id' })
  questionGroupId: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;
}
