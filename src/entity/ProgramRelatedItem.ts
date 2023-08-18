import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Program } from './Program';

@Index('program_related_item_pkey', ['id'], { unique: true })
@Entity('program_related_item', { schema: 'public' })
export class ProgramRelatedItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'class' })
  class: string;

  @Column('jsonb', { name: 'target' })
  target: object;

  @Column('numeric', { name: 'weight' })
  weight: number;

  @ManyToOne(() => Program, (program) => program.programRelatedItems, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'program_id', referencedColumnName: 'id' }])
  program: Program;
}
