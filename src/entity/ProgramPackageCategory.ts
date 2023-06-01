import { Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Category } from '~/definition/entity/category.entity';

import { ProgramPackage } from './ProgramPackage';

@Index('program_package_category_pkey', ['id'], { unique: true })
@Entity('program_package_category', { schema: 'public' })
export class ProgramPackageCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @PrimaryGeneratedColumn({ type: 'integer', name: 'position' })
  position: number

  @ManyToOne(() => ProgramPackage, programPackage => programPackage.programPackageCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'program_package_id', referencedColumnName: 'id' }])
  programPackage: ProgramPackage

  @ManyToOne(() => Category, category => category.programPackageCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'category_id', referencedColumnName: 'id' }])
  category: Category
}
