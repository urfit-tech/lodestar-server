import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Member } from '~/member/entity/member.entity';

@Index('member_device_member_id_fingerprint_id_key', ['fingerprintId', 'memberId'], { unique: true })
@Index('member_device_id_key', ['id'], { unique: true })
@Index('member_device_pkey', ['id'], { unique: true })
@Entity('member_device', { schema: 'public' })
export class MemberDevice {
  @Column('text', { name: 'member_id', unique: true })
  memberId: string;

  @Column('text', { name: 'type', nullable: true })
  type: string | null;

  @Column('jsonb', {
    name: 'options',
    nullable: true,
    default: () => 'jsonb_build_object()',
  })
  options: object | null;

  @Column('text', { name: 'fingerprint_id', unique: true })
  fingerprintId: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'logined_at',
    nullable: true,
    default: () => 'now()',
  })
  loginedAt: Date | null;

  @Column('uuid', {
    primary: true,
    name: 'id',
    default: () => 'gen_random_uuid()',
  })
  id: string;

  @Column('text', { name: 'ip_address', nullable: true })
  ipAddress: string | null;

  @Column('text', { name: 'os_name', nullable: true })
  osName: string | null;

  @Column('text', { name: 'browser', nullable: true })
  browser: string | null;

  @Column('boolean', { name: 'is_login', default: () => false })
  isLogin: boolean;

  @Column('timestamp with time zone', {
    name: 'last_login_at',
    nullable: true,
    default: () => 'now()',
  })
  lastLoginAt: Date | null;

  @ManyToOne(() => Member, (member) => member.memberDevices, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;
}
