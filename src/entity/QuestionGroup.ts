import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Member } from '~/member/entity/member.entity';

import { Question } from './Question';
import { QuestionLibrary } from './QuestionLibrary';

@Index('question_group_pkey', ['id'], { unique: true })
@Entity('question_group', { schema: 'public' })
export class QuestionGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'title' })
  title: string;

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

  @OneToMany(() => Question, (question) => question.questionGroup)
  questions: Question[];

  @ManyToOne(() => Member, (member) => member.questionGroups, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'modifier_id', referencedColumnName: 'id' }])
  modifier: Member;

  @ManyToOne(() => QuestionLibrary, (questionLibrary) => questionLibrary.questionGroups, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'question_library_id', referencedColumnName: 'id' }])
  questionLibrary: QuestionLibrary;
}
