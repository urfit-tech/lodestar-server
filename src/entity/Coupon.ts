import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { CouponCode } from './CouponCode'
import { Member } from './Member'
import { OrderLog } from './OrderLog'

@Index('coupon_member_id_coupon_code_id_key', ['couponCodeId', 'memberId'], {
  unique: true,
})
@Index('coupon_pkey', ['id'], { unique: true })
@Entity('coupon', { schema: 'public' })
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'member_id', unique: true })
  memberId: string

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date

  @Column('uuid', { name: 'coupon_code_id', unique: true })
  couponCodeId: string

  @ManyToOne(() => CouponCode, couponCode => couponCode.coupons, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'coupon_code_id', referencedColumnName: 'id' }])
  couponCode: CouponCode

  @ManyToOne(() => Member, member => member.coupons, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @OneToMany(() => OrderLog, orderLog => orderLog.discountCoupon)
  orderLogs: OrderLog[]
}
