import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from '~/definition/entity/category.entity';
import { PodcastProgram } from '~/podcast/entity/PodcastProgram';

@Index('podcast_program_category_pkey', ['id'], { unique: true })
@Entity('podcast_program_category', { schema: 'public' })
export class PodcastProgramCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('integer', { name: 'position' })
  position: number;

  @ManyToOne(() => PodcastProgram, (podcastProgram) => podcastProgram.podcastProgramCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'podcast_program_id', referencedColumnName: 'id' }])
  podcastProgram: PodcastProgram;

  @ManyToOne(() => Category, (category) => category.podcastProgramCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'category_id', referencedColumnName: 'id' }])
  category: Category;
}
