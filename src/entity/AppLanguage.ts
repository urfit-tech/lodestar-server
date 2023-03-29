import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { App } from './App'

@Index('app_language_app_id_language_key', ['appId', 'language'], {
  unique: true,
})
@Index('app_language_pkey', ['id'], { unique: true })
@Entity('app_language', { schema: 'public' })
export class AppLanguage {
  @Column('uuid', {
    primary: true,
    name: 'id',
    default: () => 'gen_random_uuid()',
  })
  id: string

  @Column('text', { name: 'app_id', unique: true })
  appId: string

  @Column('text', { name: 'language', unique: true })
  language: string

  @Column('jsonb', { name: 'data', default: () => 'jsonb_build_object()' })
  data: object

  @ManyToOne(() => App, app => app.appLanguages, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App
}
