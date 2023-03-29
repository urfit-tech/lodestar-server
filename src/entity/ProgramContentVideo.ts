import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Attachment } from './Attachment'
import { ProgramContent } from './ProgramContent'

@Index('program_content_stream_pkey', ['id'], { unique: true })
@Entity('program_content_video', { schema: 'public' })
export class ProgramContentVideo {
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

  @ManyToOne(() => Attachment, attachment => attachment.programContentVideos, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'attachment_id', referencedColumnName: 'id' }])
  attachment: Attachment

  @ManyToOne(() => ProgramContent, programContent => programContent.programContentVideos, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_content_id', referencedColumnName: 'id' }])
  programContent: ProgramContent
}
