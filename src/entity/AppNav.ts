import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { App } from './App'

@Index('app_nav_pkey', ['id'], { unique: true })
@Entity('app_nav', { schema: 'public' })
export class AppNav {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'block' })
  block: string

  @Column('integer', { name: 'position' })
  position: number

  @Column('text', { name: 'label' })
  label: string

  @Column('text', { name: 'icon', nullable: true })
  icon: string | null

  @Column('text', { name: 'href' })
  href: string

  @Column('boolean', { name: 'external', default: () => false })
  external: boolean

  @Column('text', { name: 'locale', default: () => "'zh-tw'" })
  locale: string

  @Column('text', { name: 'tag', nullable: true })
  tag: string | null

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null

  @ManyToOne(() => App, app => app.appNavs, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App

  @ManyToOne(() => AppNav, appNav => appNav.appNavs, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'parent_id', referencedColumnName: 'id' }])
  parent: AppNav

  @OneToMany(() => AppNav, appNav => appNav.parent)
  appNavs: AppNav[]
}
