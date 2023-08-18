import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AppExtendedModule } from './AppExtendedModule';
import { AppPlanModule } from './AppPlanModule';
import { Setting } from './Setting';

@Index('module_pkey', ['id'], { unique: true })
@Index('module_id_key', ['id'], { unique: true })
@Entity('module', { schema: 'public' })
export class Module {
  @PrimaryGeneratedColumn()
  id: string;

  @Column('text', { name: 'name' })
  name: string;

  @Column('text', { name: 'abstract', nullable: true })
  abstract: string | null;

  @Column('text', { name: 'category_name', nullable: true })
  categoryName: string | null;

  @OneToMany(() => AppExtendedModule, (appExtendedModule) => appExtendedModule.module)
  appExtendedModules: AppExtendedModule[];

  @OneToMany(() => AppPlanModule, (appPlanModule) => appPlanModule.module)
  appPlanModules: AppPlanModule[];

  @OneToMany(() => Setting, (setting) => setting.module)
  settings: Setting[];
}
