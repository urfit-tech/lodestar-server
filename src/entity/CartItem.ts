import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { App } from './app'

@Index('cart_item_pkey', ['id'], { unique: true })
@Entity('cart_item', { schema: 'public' })
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'fingerprint' })
  fingerprint: string

  @Column('text', { name: 'class' })
  class: string

  @Column('jsonb', { name: 'target' })
  target: object

  @ManyToOne(() => App, app => app.cartItems, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App
}
