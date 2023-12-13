import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from '~/member/entity/member.entity';
import { PlaylistPodcastProgram } from '../../entity/PlaylistPodcastProgram';
import { Podcast } from '../../entity/Podcast';
import { PodcastAlbumPodcastProgram } from './PodcastAlbumPodcastProgram';
import { PodcastProgramAudio } from '../../entity/PodcastProgramAudio';
import { PodcastProgramBody } from '../../entity/PodcastProgramBody';
import { PodcastProgramCategory } from '../../entity/PodcastProgramCategory';
import { PodcastProgramProgress } from '~/podcast/entity/PodcastProgramProgress';
import { PodcastProgramRole } from '../../entity/PodcastProgramRole';
import { PodcastProgramTag } from '../../entity/PodcastProgramTag';

@Index('podcast_program_pkey', ['id'], { unique: true })
@Entity('podcast_program', { schema: 'public' })
export class PodcastProgram {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'creator_id' })
  creatorId: string;

  @Column('timestamp with time zone', { name: 'sold_at', nullable: true })
  soldAt: Date | null;

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null;

  @Column('text', { name: 'abstract', nullable: true })
  abstract: string | null;

  @Column('text', { name: 'cover_url', nullable: true })
  coverUrl: string | null;

  @Column('text', { name: 'content_type', nullable: true })
  contentType: string | null;

  @Column('numeric', { name: 'list_price', default: () => 0 })
  listPrice: number;

  @Column('numeric', { name: 'sale_price', nullable: true })
  salePrice: number | null;

  @Column('timestamp with time zone', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @Column('numeric', { name: 'duration', default: () => 0 })
  duration: number;

  @Column('jsonb', { name: 'support_locales', nullable: true })
  supportLocales: object | null;

  @Column('text', { name: 'filename', nullable: true })
  filename: string | null;

  @Column('numeric', { name: 'duration_second', default: () => 0 })
  durationSecond: number;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @OneToMany(() => PlaylistPodcastProgram, (playlistPodcastProgram) => playlistPodcastProgram.podcastProgram)
  playlistPodcastPrograms: PlaylistPodcastProgram[];

  @OneToMany(
    () => PodcastAlbumPodcastProgram,
    (podcastAlbumPodcastProgram) => podcastAlbumPodcastProgram.podcastProgram,
  )
  podcastAlbumPodcastPrograms: PodcastAlbumPodcastProgram[];

  @ManyToOne(() => Member, (member) => member.podcastPrograms, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'creator_id', referencedColumnName: 'id' }])
  creator: Member;

  @ManyToOne(() => Podcast, (podcast) => podcast.podcastPrograms, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'podcast_id', referencedColumnName: 'id' }])
  podcast: Podcast;

  @OneToMany(() => PodcastProgramAudio, (podcastProgramAudio) => podcastProgramAudio.podcastProgram)
  podcastProgramAudios: PodcastProgramAudio[];

  @OneToMany(() => PodcastProgramBody, (podcastProgramBody) => podcastProgramBody.podcastProgram)
  podcastProgramBodies: PodcastProgramBody[];

  @OneToMany(() => PodcastProgramCategory, (podcastProgramCategory) => podcastProgramCategory.podcastProgram)
  podcastProgramCategories: PodcastProgramCategory[];

  @OneToMany(() => PodcastProgramProgress, (podcastProgramProgress) => podcastProgramProgress.podcastProgram)
  podcastProgramProgresses: PodcastProgramProgress[];

  @OneToMany(() => PodcastProgramRole, (podcastProgramRole) => podcastProgramRole.podcastProgram)
  podcastProgramRoles: PodcastProgramRole[];

  @OneToMany(() => PodcastProgramTag, (podcastProgramTag) => podcastProgramTag.podcastProgram)
  podcastProgramTags: PodcastProgramTag[];
}
