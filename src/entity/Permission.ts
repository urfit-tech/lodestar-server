import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { AppDefaultPermission } from './AppDefaultPermission'
import { MemberPermissionExtra } from './MemberPermissionExtra'
import { PermissionGroupPermission } from './PermissionGroupPermission'
import { RolePermission } from './RolePermission'

@Index('permission_pkey', ['id'], { unique: true })
@Entity('permission', { schema: 'public' })
export class Permission {
  @PrimaryGeneratedColumn()
  id: string

  @Column('text', { name: 'group' })
  group: string

  @Column('text', { name: 'description', nullable: true })
  description: string | null

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date

  @OneToMany(() => AppDefaultPermission, appDefaultPermission => appDefaultPermission.permission)
  appDefaultPermissions: AppDefaultPermission[]

  @OneToMany(() => MemberPermissionExtra, memberPermissionExtra => memberPermissionExtra.permission)
  memberPermissionExtras: MemberPermissionExtra[]

  @OneToMany(() => PermissionGroupPermission, permissionGroupPermission => permissionGroupPermission.permission)
  permissionGroupPermissions: PermissionGroupPermission[]

  @OneToMany(() => RolePermission, rolePermission => rolePermission.permission)
  rolePermissions: RolePermission[]
}
