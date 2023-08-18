import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PodcastProgram } from './PodcastProgram';

@Index('podcast_program_audio_pkey', ['id'], { unique: true })
@Entity('podcast_program_audio', { schema: 'public' })
export class PodcastProgramAudio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb', { name: 'data' })
  data: object;

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

  @Column('timestamp with time zone', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column('integer', { name: 'position' })
  position: number;

  @ManyToOne(() => PodcastProgram, (podcastProgram) => podcastProgram.podcastProgramAudios, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'podcast_program_id', referencedColumnName: 'id' }])
  podcastProgram: PodcastProgram;
}
