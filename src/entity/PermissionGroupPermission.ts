import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Permission } from '~/permission/entity/permission.entity';

import { PermissionGroup } from './PermissionGroup';

@Index('permission_group_permission_pkey', ['id'], { unique: true })
@Index('permission_group_permission_permission_group_id_permission_id_k', ['permissionGroupId', 'permissionId'], {
  unique: true,
})
@Entity('permission_group_permission', { schema: 'public' })
export class PermissionGroupPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'permission_group_id', unique: true })
  permissionGroupId: string;

  @Column('text', { name: 'permission_id', unique: true })
  permissionId: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @ManyToOne(() => PermissionGroup, (permissionGroup) => permissionGroup.permissionGroupPermissions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'permission_group_id', referencedColumnName: 'id' }])
  permissionGroup: PermissionGroup;

  @ManyToOne(() => Permission, (permission) => permission.permissionGroupPermissions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'permission_id', referencedColumnName: 'id' }])
  permission: Permission;
}
