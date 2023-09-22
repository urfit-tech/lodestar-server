import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Permission } from '~/permission/entity/permission.entity';

import { App } from '~/app/entity/app.entity';

@Index('app_default_permission_pkey', ['id'], { unique: true })
@Entity('app_default_permission', { schema: 'public' })
export class AppDefaultPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', name: 'permission_id' })
  permissionId: string;

  @ManyToOne(() => App, (app) => app.appDefaultPermissions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App;

  @ManyToOne(() => Permission, (permission) => permission.appDefaultPermissions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'permission_id', referencedColumnName: 'id' }])
  permission: Permission;
}
