import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Index('member_certificate_certificate_id_member_id_number_key', ['certificateId', 'memberId', 'number'], {
  unique: true,
})
@Index('member_certificate_pkey', ['id'], { unique: true })
@Entity('member_certificate', { schema: 'public' })
export class MemberCertificate {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'member_id', unique: true })
  memberId: string

  @Column('text', { name: 'number', unique: true })
  number: string

  @Column('uuid', { name: 'certificate_id', unique: true })
  certificateId: string

  @Column('jsonb', { name: 'values' })
  values: object

  @Column('timestamp with time zone', { name: 'delivered_at' })
  deliveredAt: Date

  @Column('timestamp with time zone', { name: 'expired_at', nullable: true })
  expiredAt: Date | null
}
