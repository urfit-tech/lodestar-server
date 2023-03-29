import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Index('user_permission_pkey', ['id'], { unique: true })
@Entity('user_permission', { schema: 'public' })
export class UserPermission {
  @Column('text', { name: 'user_id', default: () => 'gen_random_uuid()' })
  userId: string

  @Column('text', { name: 'permission_id' })
  permissionId: string

  @PrimaryGeneratedColumn('uuid')
  id: string

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
}
