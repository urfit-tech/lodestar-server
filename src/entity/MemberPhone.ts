import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from './Member'

@Index('member_phone_pkey', ['id'], { unique: true })
@Index('member_phone_member_id_phone_key', ['memberId', 'phone'], {
  unique: true,
})
@Entity('member_phone', { schema: 'public' })
export class MemberPhone {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'member_id', unique: true })
  memberId: string

  @Column('text', { name: 'phone', unique: true })
  phone: string

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

  @Column('boolean', { name: 'is_primary', default: () => false })
  isPrimary: boolean

  @Column('boolean', { name: 'is_valid', default: () => true })
  isValid: boolean

  @ManyToOne(() => Member, member => member.memberPhones, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member
}
