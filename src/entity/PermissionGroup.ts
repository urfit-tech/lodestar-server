import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MemberPermissionGroup } from './MemberPermissionGroup';
import { PermissionGroupPermission } from './PermissionGroupPermission';

@Index('permission_group_name_app_id_key', ['appId', 'name'], { unique: true })
@Index('permission_group_pkey', ['id'], { unique: true })
@Entity('permission_group', { schema: 'public' })
export class PermissionGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'name', unique: true })
  name: string;

  @Column('text', { name: 'app_id', unique: true })
  appId: string;

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

  @OneToMany(() => MemberPermissionGroup, (memberPermissionGroup) => memberPermissionGroup.permissionGroup)
  memberPermissionGroups: MemberPermissionGroup[];

  @OneToMany(() => PermissionGroupPermission, (permissionGroupPermission) => permissionGroupPermission.permissionGroup)
  permissionGroupPermissions: PermissionGroupPermission[];
}
