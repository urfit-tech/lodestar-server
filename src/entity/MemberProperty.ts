import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Member } from './Member'
import { Property } from './Property'

@Index('member_property_pkey', ['id'], { unique: true })
@Index('member_property_member_id_property_id_key', ['memberId', 'propertyId'], { unique: true })
@Entity('member_property', { schema: 'public' })
export class MemberProperty {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'member_id', unique: true })
  memberId: string

  @Column('uuid', { name: 'property_id', unique: true })
  propertyId: string

  @Column('text', { name: 'value' })
  value: string

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

  @ManyToOne(() => Member, member => member.memberProperties, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member

  @ManyToOne(() => Property, property => property.memberProperties, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'property_id', referencedColumnName: 'id' }])
  property: Property
}
