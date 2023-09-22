import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Permission } from '~/permission/entity/permission.entity';

import { Role } from './Role';

@Index('role_permission_pkey', ['id'], { unique: true })
@Index('role_permission_role_id_permission_id_key', ['permissionId', 'roleId'], { unique: true })
@Entity('role_permission', { schema: 'public' })
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'role_id', unique: true })
  roleId: string;

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

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'permission_id', referencedColumnName: 'id' }])
  permission: Permission;

  @ManyToOne(() => Role, (role) => role.rolePermissions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'role_id', referencedColumnName: 'id' }])
  role: Role;
}
