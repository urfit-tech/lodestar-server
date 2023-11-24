import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from '~/member/entity/member.entity';
import { PodcastAlbum } from './PodcastAlbum';
import { PodcastProgram } from '../../entity/PodcastProgram';

@Index('podcast_program_progress_pkey', ['id'], { unique: true })
@Index('podcast_program_progress_member_id_podcast_program_id_key', ['memberId', 'podcastProgramId'], { unique: true })
@Entity('podcast_program_progress', { schema: 'public' })
export class PodcastProgramProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'member_id', unique: true })
  memberId: string;

  @Column('uuid', { name: 'podcast_program_id', unique: true })
  podcastProgramId: string;

  @Column('uuid', { name: 'podcast_album_id', unique: true })
  podcastAlbumId: string;

  @Column('numeric', { name: 'progress', default: () => 0 })
  progress: number;

  @Column('numeric', { name: 'last_progress', default: () => 0 })
  lastProgress: number;

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

  @ManyToOne(() => Member, (member) => member.podcastProgramProgresses, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;

  @ManyToOne(() => PodcastAlbum, (podcastAlbum) => podcastAlbum.podcastProgramProgresses, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'podcast_album_id', referencedColumnName: 'id' }])
  podcastAlbum: PodcastAlbum;

  @ManyToOne(() => PodcastProgram, (podcastProgram) => podcastProgram.podcastProgramProgresses, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'podcast_program_id', referencedColumnName: 'id' }])
  podcastProgram: PodcastProgram;
}
