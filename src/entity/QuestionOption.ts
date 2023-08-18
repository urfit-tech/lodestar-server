import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Question } from './Question';

@Index('question_option_pkey', ['id'], { unique: true })
@Entity('question_option', { schema: 'public' })
export class QuestionOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'value' })
  value: string;

  @Column('boolean', { name: 'is_answer', nullable: true })
  isAnswer: boolean | null;

  @Column('integer', { name: 'position' })
  position: number;

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

  @Column('timestamp with time zone', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Question, (question) => question.questionOptions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'question_id', referencedColumnName: 'id' }])
  question: Question;
}
