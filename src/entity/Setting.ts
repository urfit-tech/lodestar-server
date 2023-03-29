import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm'
import { AppSecret } from './AppSecret'
import { AppSetting } from './AppSetting'
import { Module } from './Module'

@Index('setting_pkey', ['key'], { unique: true })
@Entity('setting', { schema: 'public' })
export class Setting {
  @PrimaryColumn()
  key: string

  @Column('text', { name: 'type', default: () => "'string'" })
  type: string

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null

  @Column('boolean', { name: 'is_protected', default: () => false })
  isProtected: boolean

  @Column('boolean', { name: 'is_required', default: () => false })
  isRequired: boolean

  @Column('boolean', { name: 'is_secret', default: () => false })
  isSecret: boolean

  @OneToMany(() => AppSecret, appSecret => appSecret.key2)
  appSecrets: AppSecret[]

  @OneToMany(() => AppSetting, appSetting => appSetting.key2)
  appSettings: AppSetting[]

  @ManyToOne(() => Module, module => module.settings, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'module_id', referencedColumnName: 'id' }])
  module: Module
}
