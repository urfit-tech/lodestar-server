import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Category } from '~/definition/entity/category.entity';

import { Project } from './Project';

@Index('project_category_pkey', ['id'], { unique: true })
@Entity('project_category', { schema: 'public' })
export class ProjectCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('integer', { name: 'position' })
  position: number

  @ManyToOne(() => Project, project => project.projectCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'project_id', referencedColumnName: 'id' }])
  project: Project

  @ManyToOne(() => Category, category => category.projectCategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'category_id', referencedColumnName: 'id' }])
  category: Category
}
