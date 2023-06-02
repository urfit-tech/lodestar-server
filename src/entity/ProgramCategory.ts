import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Category } from '~/definition/entity/category.entity';

import { Program } from './Program';

@Index('program_category_pkey', ['id'], { unique: true })
@Index('program_category_program_id', ['programId'], {})
@Entity('program_category', { schema: 'public' })
export class ProgramCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid', { name: 'program_id' })
  programId: string

  @Column('integer', { name: 'position' })
  position: number

  @ManyToOne(() => Program, program => program.programCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_id', referencedColumnName: 'id' }])
  program: Program

  @ManyToOne(() => Category, category => category.programCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'category_id', referencedColumnName: 'id' }])
  category: Category
}
