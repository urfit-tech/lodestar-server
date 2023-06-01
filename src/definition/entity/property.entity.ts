import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { App } from '~/entity/App';
import { SignupProperty } from '~/entity/SignupProperty';

import { MemberProperty } from '~/member/entity/member_property.entity';

@Index('property_pkey', ['id'], { unique: true })
@Entity('property', { schema: 'public' })
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'type' })
  type: string

  @Column('text', { name: 'name' })
  name: string

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

  @Column('integer', { name: 'position', default: () => 0 })
  position: number

  @Column('text', { name: 'placeholder', nullable: true })
  placeholder: string | null

  @Column('boolean', { name: 'is_editable', default: () => false })
  isEditable: boolean

  @Column('boolean', { name: 'is_business', default: () => false })
  isBusiness: boolean

  @OneToMany(() => MemberProperty, memberProperty => memberProperty.property)
  memberProperties: MemberProperty[]

  @ManyToOne(() => App, app => app.properties, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App

  @OneToMany(() => SignupProperty, signupProperty => signupProperty.property)
  signupProperties: SignupProperty[]
}
