import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import { App } from './app'

@Index('app_usage_pkey', ['appId', 'dateHour'], { unique: true })
@Entity('app_usage', { schema: 'public' })
export class AppUsage {
  @PrimaryColumn()
  appId: string

  @PrimaryColumn()
  dateHour: string

  @Column('numeric', { name: 'video_duration', default: () => -1 })
  videoDuration: number

  @Column('numeric', { name: 'watched_seconds', default: () => 0 })
  watchedSeconds: number

  @ManyToOne(() => App, app => app.appUsages, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App
}
