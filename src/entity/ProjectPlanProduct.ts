import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Product } from './product'
import { ProjectPlan } from './ProjectPlan'

@Index('project_plan_product_pkey', ['id'], { unique: true })
@Index('project_plan_product_project_plan_id_product_id_key', ['productId', 'projectPlanId'], { unique: true })
@Entity('project_plan_product', { schema: 'public' })
export class ProjectPlanProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid', { name: 'project_plan_id', unique: true })
  projectPlanId: string

  @Column('text', { name: 'product_id', unique: true })
  productId: string

  @Column('jsonb', { name: 'options' })
  options: object

  @ManyToOne(() => Product, product => product.projectPlanProducts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'product_id', referencedColumnName: 'id' }])
  product: Product

  @ManyToOne(() => ProjectPlan, projectPlan => projectPlan.projectPlanProducts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'project_plan_id', referencedColumnName: 'id' }])
  projectPlan: ProjectPlan
}
