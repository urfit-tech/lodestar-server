import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Category } from './Category'
import { PodcastAlbum } from './PodcastAlbum'

@Index('podcast_album_category_pkey', ['id'], { unique: true })
@Entity('podcast_album_category', { schema: 'public' })
export class PodcastAlbumCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('integer', { name: 'position', default: () => 0 })
  position: number

  @ManyToOne(() => PodcastAlbum, podcastAlbum => podcastAlbum.podcastAlbumCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'podcast_album_id', referencedColumnName: 'id' }])
  podcastAlbum: PodcastAlbum

  @ManyToOne(() => Category, category => category.podcastAlbumCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'category_id', referencedColumnName: 'id' }])
  category: Category
}
