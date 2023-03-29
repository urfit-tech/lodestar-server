import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Identity } from './Identity'
import { Member } from './Member'
import { Project } from './Project'

@Index('project_role_pkey', ['id'], { unique: true })
@Entity('project_role', { schema: 'public' })
export class ProjectRole {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'rejected_reason', nullable: true })
  rejectedReason: string | null

  @Column('timestamp with time zone', { name: 'rejected_at', nullable: true })
  rejectedAt: Date | null

  @Column('boolean', {
    name: 'has_sended_marked_notification',
    default: () => false,
  })
  hasSendedMarkedNotification: boolean

  @Column('timestamp with time zone', { name: 'agreed_at', nullable: true })
  agreedAt: Date | null

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @ManyToOne(() => Identity, identity => identity.projectRoles, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'identity_id', referencedColumnName: 'id' }])
  identity: Identity

  @ManyToOne(() => Member, member => member.projectRoles, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @ManyToOne(() => Project, project => project.projectRoles, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'project_id', referencedColumnName: 'id' }])
  project: Project
}
