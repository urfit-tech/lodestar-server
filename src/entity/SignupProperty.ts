import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Property } from '~/definition/entity/property.entity';

@Index('signup_property_pkey', ['id'], { unique: true })
@Entity('signup_property', { schema: 'public' })
export class SignupProperty {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'app_id' })
  appId: string

  @Column('text', { name: 'type' })
  type: string

  @Column('boolean', { name: 'is_required' })
  isRequired: boolean

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null

  @Column('integer', { name: 'position' })
  position: number

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

  @ManyToOne(() => Property, property => property.signupProperties, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'property_id', referencedColumnName: 'id' }])
  property: Property
}
