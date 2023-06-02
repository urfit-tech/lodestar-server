import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from '~/member/entity/member.entity';
import { PodcastAlbumCategory } from './PodcastAlbumCategory'
import { PodcastAlbumPodcastProgram } from './PodcastAlbumPodcastProgram'
import { PodcastProgramProgress } from './PodcastProgramProgress'

@Index('podcast_album_pkey', ['id'], { unique: true })
@Entity('podcast_album', { schema: 'public' })
export class PodcastAlbum {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'title' })
  title: string

  @Column('text', { name: 'cover_url', nullable: true })
  coverUrl: string | null

  @Column('text', { name: 'description', nullable: true })
  description: string | null

  @Column('boolean', { name: 'is_public', default: () => false })
  isPublic: boolean

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

  @Column('text', { name: 'app_id' })
  appId: string

  @Column('boolean', { name: 'is_deleted', default: () => false })
  isDeleted: boolean

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null

  @Column('text', { name: 'abstract', nullable: true })
  abstract: string | null

  @ManyToOne(() => Member, member => member.podcastAlbums, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'author_id', referencedColumnName: 'id' }])
  author: Member

  @OneToMany(() => PodcastAlbumCategory, podcastAlbumCategory => podcastAlbumCategory.podcastAlbum)
  podcastAlbumCategories: PodcastAlbumCategory[]

  @OneToMany(() => PodcastAlbumPodcastProgram, podcastAlbumPodcastProgram => podcastAlbumPodcastProgram.podcastAlbum)
  podcastAlbumPodcastPrograms: PodcastAlbumPodcastProgram[]

  @OneToMany(() => PodcastProgramProgress, podcastProgramProgress => podcastProgramProgress.podcastAlbum)
  podcastProgramProgresses: PodcastProgramProgress[]
}
