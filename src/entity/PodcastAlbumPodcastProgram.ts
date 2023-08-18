import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PodcastAlbum } from './PodcastAlbum';
import { PodcastProgram } from './PodcastProgram';

@Index('podcast_album_podcast_program_pkey', ['id'], { unique: true })
@Index('podcast_album_podcast_program_podcast_album_id_podcast_program_', ['podcastAlbumId', 'podcastProgramId'], {
  unique: true,
})
@Entity('podcast_album_podcast_program', { schema: 'public' })
export class PodcastAlbumPodcastProgram {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'podcast_album_id', unique: true })
  podcastAlbumId: string;

  @Column('uuid', { name: 'podcast_program_id', unique: true })
  podcastProgramId: string;

  @Column('integer', { name: 'position', default: () => 0 })
  position: number;

  @ManyToOne(() => PodcastAlbum, (podcastAlbum) => podcastAlbum.podcastAlbumPodcastPrograms, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'podcast_album_id', referencedColumnName: 'id' }])
  podcastAlbum: PodcastAlbum;

  @ManyToOne(() => PodcastProgram, (podcastProgram) => podcastProgram.podcastAlbumPodcastPrograms, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'podcast_program_id', referencedColumnName: 'id' }])
  podcastProgram: PodcastProgram;
}
