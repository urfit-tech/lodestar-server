import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { App } from './app'

@Index('app_admin_pkey', ['host'], { unique: true })
@Entity('app_admin', { schema: 'public' })
export class AppAdmin {
  @PrimaryGeneratedColumn()
  host: string

  @Column('integer', { name: 'position', nullable: true })
  position: number | null

  @Column('text', { name: 'api_host', nullable: true })
  apiHost: string | null

  @ManyToOne(() => App, app => app.appAdmins, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App
}
