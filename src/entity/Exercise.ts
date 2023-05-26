import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ProgramContent } from '~/program/entity/program_content.entity';

import { Member } from '~/member/entity/member.entity';;

@Index('exercise_pkey', ['id'], { unique: true })
@Entity('exercise', { schema: 'public' })
export class Exercise {
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

  @Column('jsonb', { name: 'answer', nullable: true })
  answer: object | null

  @Column('uuid', { name: 'exam_id', nullable: true })
  examId: string | null

  @Column('timestamp with time zone', { name: 'started_at', nullable: true })
  startedAt: Date | null

  @Column('timestamp with time zone', { name: 'ended_at', nullable: true })
  endedAt: Date | null

  @ManyToOne(() => Member, member => member.exercises, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @ManyToOne(() => ProgramContent, programContent => programContent.exercises, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_content_id', referencedColumnName: 'id' }])
  programContent: ProgramContent
}
