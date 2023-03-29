import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { PodcastProgram } from './PodcastProgram'
import { Tag } from './Tag'

@Index('podcast_program_tag_pkey', ['id'], { unique: true })
@Index('podcast_program_tag_podcast_program_id_tag_name_key', ['podcastProgramId', 'tagName'], { unique: true })
@Entity('podcast_program_tag', { schema: 'public' })
export class PodcastProgramTag {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid', { name: 'podcast_program_id', unique: true })
  podcastProgramId: string

  @Column('text', { name: 'tag_name', unique: true })
  tagName: string

  @Column('integer', { name: 'position', default: () => 0 })
  position: number

  @ManyToOne(() => PodcastProgram, podcastProgram => podcastProgram.podcastProgramTags, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'podcast_program_id', referencedColumnName: 'id' }])
  podcastProgram: PodcastProgram

  @ManyToOne(() => Tag, tag => tag.podcastProgramTags, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'tag_name', referencedColumnName: 'name' }])
  tagName2: Tag
}
