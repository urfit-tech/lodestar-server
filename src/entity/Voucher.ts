import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Member } from '~/member/entity/member.entity';

import { VoucherCode } from './VoucherCode';

@Index('voucher_pkey', ['id'], { unique: true })
@Index('voucher_voucher_code_id_member_id_key', ['memberId', 'voucherCodeId'], {
  unique: true,
})
@Entity('voucher', { schema: 'public' })
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'voucher_code_id', unique: true })
  voucherCodeId: string;

  @Column('text', { name: 'member_id', unique: true })
  memberId: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp without time zone', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Member, (member) => member.vouchers, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;

  @ManyToOne(() => VoucherCode, (voucherCode) => voucherCode.vouchers, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'voucher_code_id', referencedColumnName: 'id' }])
  voucherCode: VoucherCode;
}
