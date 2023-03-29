import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from './Member'
import { QuestionGroup } from './QuestionGroup'

@Index('question_library_pkey', ['id'], { unique: true })
@Entity('question_library', { schema: 'public' })
export class QuestionLibrary {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'app_id' })
  appId: string

  @Column('text', { name: 'title' })
  title: string

  @Column('text', { name: 'abstract', nullable: true })
  abstract: string | null

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

  @OneToMany(() => QuestionGroup, questionGroup => questionGroup.questionLibrary)
  questionGroups: QuestionGroup[]

  @ManyToOne(() => Member, member => member.questionLibraries, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'modifier_id', referencedColumnName: 'id' }])
  modifier: Member
}
