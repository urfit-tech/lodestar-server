import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { ProjectRole } from './ProjectRole'

@Index('identity_pkey', ['id'], { unique: true })
@Entity('identity', { schema: 'public' })
export class Identity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'app_id' })
  appId: string

  @Column('text', { name: 'type' })
  type: string

  @Column('text', { name: 'name' })
  name: string

  @Column('integer', { name: 'position', default: () => 0 })
  position: number

  @OneToMany(() => ProjectRole, projectRole => projectRole.identity)
  projectRoles: ProjectRole[]
}
