import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { App } from '~/entity/App';
import { Setting } from '~/entity/Setting';

@Index('app_setting_app_id_key_key', ['appId', 'key'], { unique: true })
@Index('app_setting_pkey', ['id'], { unique: true })
@Entity('app_setting', { schema: 'public' })
export class AppSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'app_id', unique: true })
  appId: string;

  @Column('text', { name: 'key', unique: true })
  key: string;

  @Column('text', { name: 'value' })
  value: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null;

  @ManyToOne(() => App, (app) => app.appSettings, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App;

  @ManyToOne(() => Setting, (setting) => setting.appSettings, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'key', referencedColumnName: 'key' }])
  key2: Setting;
}
