import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from '~/member/entity/member.entity';
import { PermissionGroup } from '~/entity/PermissionGroup';

@Index('member_permission_group_pkey', ['id'], { unique: true })
@Entity('member_permission_group', { schema: 'public' })
export class MemberPermissionGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'member_id' })
  memberId: string;

  @Column('uuid', { name: 'permission_group_id' })
  permissionGroupId: string;

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

  @ManyToOne(() => Member, (member) => member.memberPermissionGroups, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;

  @ManyToOne(() => PermissionGroup, (permissionGroup) => permissionGroup.memberPermissionGroups, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'permission_group_id', referencedColumnName: 'id' }])
  permissionGroup: PermissionGroup;
}
