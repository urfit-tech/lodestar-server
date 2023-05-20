import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ProgramContent } from '~/program/entity/program_content.entity';

import { Member } from './Member';

@Index('practice_pkey', ['id'], { unique: true })
@Entity('practice', { schema: 'public' })
export class Practice {
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

  @Column('text', { name: 'title' })
  title: string

  @Column('text', { name: 'description', nullable: true })
  description: string | null

  @Column('text', { name: 'cover_url', nullable: true })
  coverUrl: string | null

  @Column('timestamp with time zone', { name: 'reviewed_at', nullable: true })
  reviewedAt: Date | null

  @Column('boolean', { name: 'is_deleted', default: () => false })
  isDeleted: boolean

  @ManyToOne(() => Member, member => member.practices, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @ManyToOne(() => ProgramContent, programContent => programContent.practices, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_content_id', referencedColumnName: 'id' }])
  programContent: ProgramContent
}
