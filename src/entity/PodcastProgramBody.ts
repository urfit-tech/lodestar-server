import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PodcastProgram } from './PodcastProgram';

@Index('podcast_program_body_pkey', ['id'], { unique: true })
@Entity('podcast_program_body', { schema: 'public' })
export class PodcastProgramBody {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('integer', { name: 'position', default: () => 0 })
  position: number;

  @Column('jsonb', { name: 'data', nullable: true })
  data: object | null;

  @Column('timestamp with time zone', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => PodcastProgram, (podcastProgram) => podcastProgram.podcastProgramBodies, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'podcast_program_id', referencedColumnName: 'id' }])
  podcastProgram: PodcastProgram;
}
