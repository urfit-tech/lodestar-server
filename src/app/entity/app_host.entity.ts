import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { App } from './app.entity';

@Index('app_host_pkey', ['host'], { unique: true })
@Entity('app_host', { schema: 'public' })
export class AppHost {
  @PrimaryColumn()
  host: string

  @Column('integer', { name: 'priority', default: () => 0 })
  priority: number

  @ManyToOne(() => App, app => app.appHosts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App
}
