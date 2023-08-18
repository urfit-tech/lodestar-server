import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { QuestionGroup } from './QuestionGroup';
import { QuestionOption } from './QuestionOption';

@Index('question_pkey', ['id'], { unique: true })
@Entity('question', { schema: 'public' })
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'type', default: () => "'single'" })
  type: string;

  @Column('text', { name: 'subject' })
  subject: string;

  @Column('text', { name: 'layout' })
  layout: string;

  @Column('text', { name: 'font' })
  font: string;

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

  @Column('text', { name: 'explanation', nullable: true })
  explanation: string | null;

  @ManyToOne(() => QuestionGroup, (questionGroup) => questionGroup.questions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'question_group_id', referencedColumnName: 'id' }])
  questionGroup: QuestionGroup;

  @OneToMany(() => QuestionOption, (questionOption) => questionOption.question)
  questionOptions: QuestionOption[];
}
