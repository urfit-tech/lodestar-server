import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from './Member'
import { Merchandise } from './Merchandise'

@Index('member_shop_pkey', ['id'], { unique: true })
@Entity('member_shop', { schema: 'public' })
export class MemberShop {
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

  @Column('text', { name: 'title' })
  title: string

  @Column('jsonb', { name: 'shipping_methods', nullable: true })
  shippingMethods: object | null

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null

  @Column('text', { name: 'cover_url', nullable: true })
  coverUrl: string | null

  @ManyToOne(() => Member, member => member.memberShops, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @OneToMany(() => Merchandise, merchandise => merchandise.memberShop)
  merchandises: Merchandise[]
}
