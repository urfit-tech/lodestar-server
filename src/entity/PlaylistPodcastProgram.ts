import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Playlist } from './Playlist';
import { PodcastProgram } from '~/podcast/entity/PodcastProgram';

@Index('playlist_podcast_program_pkey', ['id'], { unique: true })
@Entity('playlist_podcast_program', { schema: 'public' })
export class PlaylistPodcastProgram {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @Column('integer', { name: 'position' })
  position: number;

  @ManyToOne(() => Playlist, (playlist) => playlist.playlistPodcastPrograms, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'playlist_id', referencedColumnName: 'id' }])
  playlist: Playlist;

  @ManyToOne(() => PodcastProgram, (podcastProgram) => podcastProgram.playlistPodcastPrograms, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'podcast_program_id', referencedColumnName: 'id' }])
  podcastProgram: PodcastProgram;
}
