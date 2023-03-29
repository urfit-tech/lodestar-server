import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { AppPlan } from './AppPlan'
import { Module } from './Module'

@Index('app_plan_module_pkey', ['id'], { unique: true })
@Entity('app_plan_module', { schema: 'public' })
export class AppPlanModule {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date

  @ManyToOne(() => AppPlan, appPlan => appPlan.appPlanModules, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_plan_id', referencedColumnName: 'id' }])
  appPlan: AppPlan

  @ManyToOne(() => Module, module => module.appPlanModules, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'module_id', referencedColumnName: 'id' }])
  module: Module
}
