import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ProgramContent } from '~/program/entity/program_content.entity';

import { Member } from './Member';

@Index('program_content_log_created_at', ['createdAt'], {})
@Index('program_content_log_pkey', ['id'], { unique: true })
@Index('program_content_log_member_id', ['memberId'], {})
@Entity('program_content_log', { schema: 'public' })
export class ProgramContentLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'member_id' })
  memberId: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('numeric', { name: 'playback_rate' })
  playbackRate: number

  @Column('numeric', { name: 'started_at' })
  startedAt: number

  @Column('numeric', { name: 'ended_at' })
  endedAt: number

  @ManyToOne(() => Member, member => member.programContentLogs, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @ManyToOne(() => ProgramContent, programContent => programContent.programContentLogs, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_content_id', referencedColumnName: 'id' }])
  programContent: ProgramContent
}
