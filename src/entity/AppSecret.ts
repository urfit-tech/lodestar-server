import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { App } from './App'
import { Setting } from './Setting'

@Index('app_secret_app_id_key_key', ['appId', 'key'], { unique: true })
@Index('app_secret_pkey', ['id'], { unique: true })
@Entity('app_secret', { schema: 'public' })
export class AppSecret {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'app_id', unique: true })
  appId: string

  @Column('text', { name: 'key', unique: true })
  key: string

  @Column('text', { name: 'value' })
  value: string

  @ManyToOne(() => App, app => app.appSecrets, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App

  @ManyToOne(() => Setting, setting => setting.appSecrets, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'key', referencedColumnName: 'key' }])
  key2: Setting
}
