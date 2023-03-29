import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from './Member'

@Index('notification_pkey', ['id'], { unique: true })
@Index('notification_updated_at_desc_nulls_first_index', ['updatedAt'], {})
@Index('notification_updated_at_desc', ['updatedAt'], {})
@Entity('notification', { schema: 'public' })
export class Notification {
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

  @Column('timestamp with time zone', { name: 'read_at', nullable: true })
  readAt: Date | null

  @Column('text', { name: 'reference_url', nullable: true })
  referenceUrl: string | null

  @Column('text', { name: 'type', nullable: true })
  type: string | null

  @Column('text', { name: 'extra', nullable: true })
  extra: string | null

  @Column('text', { name: 'description' })
  description: string

  @Column('text', { name: 'avatar', nullable: true })
  avatar: string | null

  @ManyToOne(() => Member, member => member.notifications, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'source_member_id', referencedColumnName: 'id' }])
  sourceMember: Member

  @ManyToOne(() => Member, member => member.notifications2, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'target_member_id', referencedColumnName: 'id' }])
  targetMember: Member
}
