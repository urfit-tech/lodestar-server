import { Column, Entity, Index, OneToMany, PrimaryColumn } from 'typeorm';

import { App } from '~/app/entity/app.entity';

import { AppPlanModule } from './AppPlanModule';

@Index('app_plan_pkey', ['id'], { unique: true })
@Entity('app_plan', { schema: 'public' })
export class AppPlan {
  @PrimaryColumn()
  id: string;

  @Column('text', { name: 'name' })
  name: string;

  @Column('text', { name: 'description' })
  description: string;

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

  @Column('numeric', { name: 'video_duration', default: () => -1 })
  videoDuration: number;

  @Column('numeric', { name: 'watched_seconds', default: () => -1 })
  watchedSeconds: number;

  @OneToMany(() => App, (app) => app.appPlan)
  apps: App[];

  @OneToMany(() => AppPlanModule, (appPlanModule) => appPlanModule.appPlan)
  appPlanModules: AppPlanModule[];
}
