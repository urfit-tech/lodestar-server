import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ProgramContent } from '~/program/entity/program_content.entity';

@Index('program_content_audio_pkey', ['id'], { unique: true })
@Entity('program_content_audio', { schema: 'public' })
export class ProgramContentAudio {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('jsonb', { name: 'data' })
  data: object

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

  @ManyToOne(() => ProgramContent, programContent => programContent.programContentAudios, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_content_id', referencedColumnName: 'id' }])
  programContent: ProgramContent
}
