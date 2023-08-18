import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RolePermission } from './RolePermission';

@Index('role_pkey', ['id'], { unique: true })
@Entity('role', { schema: 'public' })
export class Role {
  @PrimaryGeneratedColumn()
  id: string;

  @Column('text', { name: 'name' })
  name: string;

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

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];
}
