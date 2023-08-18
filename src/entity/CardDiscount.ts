import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Card } from './Card';
import { Product } from './Product';

@Index('card_discount_card_id_product_id_key', ['cardId', 'productId'], {
  unique: true,
})
@Index('card_discount_pkey', ['id'], { unique: true })
@Entity('card_discount', { schema: 'public' })
export class CardDiscount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'card_id', unique: true })
  cardId: string;

  @Column('text', { name: 'product_id', unique: true })
  productId: string;

  @Column('numeric', { name: 'amount' })
  amount: number;

  @Column('text', { name: 'type' })
  type: string;

  @ManyToOne(() => Card, (card) => card.cardDiscounts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'card_id', referencedColumnName: 'id' }])
  card: Card;

  @ManyToOne(() => Product, (product) => product.cardDiscounts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'product_id', referencedColumnName: 'id' }])
  product: Product;
}
