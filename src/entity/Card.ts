import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { App } from './app'
import { CardDiscount } from './CardDiscount'

@Index('card_pkey', ['id'], { unique: true })
@Entity('card', { schema: 'public' })
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', { name: 'title' })
  title: string

  @Column('text', { name: 'description' })
  description: string

  @Column('text', { name: 'template' })
  template: string

  @Column('text', { name: 'creator_id', nullable: true })
  creatorId: string | null

  @ManyToOne(() => App, app => app.cards, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App

  @OneToMany(() => CardDiscount, cardDiscount => cardDiscount.card)
  cardDiscounts: CardDiscount[]
}
