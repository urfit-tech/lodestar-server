import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { File } from '~/entity/File'
import { Member } from '~/entity/Member'
import { ProgramContentVideo } from '~/entity/ProgramContentVideo'

@Index('attachment_pkey', ['id'], { unique: true })
@Entity('attachment', { schema: 'public' })
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('jsonb', { name: 'data', nullable: true })
  data: object | null

  @Column('text', { name: 'type', nullable: true })
  type: string | null

  @Column('text', { name: 'target', nullable: true })
  target: string | null

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

  @Column('jsonb', { name: 'options', nullable: true })
  options: any | null

  @Column('text', { name: 'app_id' })
  appId: string

  @Column('boolean', { name: 'is_deleted', default: () => false })
  isDeleted: boolean

  @Column('text', { name: 'content_type', nullable: true })
  contentType: string | null

  @Column('text', { name: 'name', nullable: true })
  name: string | null

  @Column('numeric', { name: 'size', default: () => -1 })
  size: number

  @Column('text', { name: 'thumbnail_url', nullable: true })
  thumbnailUrl: string | null

  @Column('text', { name: 'filename', nullable: true })
  filename: string | null

  @Column('numeric', { name: 'duration', nullable: true })
  duration: number | null

  @Column('text', { name: 'status', default: () => "'READY'" })
  status: string

  @Column('text', { name: 'family', nullable: true })
  family: string | null

  @ManyToOne(() => Member, member => member.attachments, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'author_id', referencedColumnName: 'id' }])
  author: Member

  @ManyToOne(() => File, file => file.attachments, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'file_id', referencedColumnName: 'id' }])
  file: File

  @OneToMany(() => ProgramContentVideo, programContentVideo => programContentVideo.attachment)
  programContentVideos: ProgramContentVideo[]
}
