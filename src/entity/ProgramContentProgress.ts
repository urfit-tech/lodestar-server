import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ProgramContent } from '~/program/entity/program_content.entity';

import { Member } from './Member';

@Index('program_content_progress_pkey', ['id'], { unique: true })
@Index('program_content_progress_member_id_program_content_id_key', ['memberId', 'programContentId'], { unique: true })
@Entity('program_content_progress', { schema: 'public' })
export class ProgramContentProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'member_id', unique: true })
  memberId: string

  @Column('uuid', { name: 'program_content_id', unique: true })
  programContentId: string

  @Column('numeric', { name: 'progress', default: () => 0 })
  progress: number

  @Column('numeric', { name: 'last_progress', default: () => 0 })
  lastProgress: number

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null

  @ManyToOne(() => Member, member => member.programContentProgresses, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @ManyToOne(() => ProgramContent, programContent => programContent.programContentProgresses, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_content_id', referencedColumnName: 'id' }])
  programContent: ProgramContent
}
