import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './Product';

@Index('product_inventory_pkey', ['id'], { unique: true })
@Entity('product_inventory', { schema: 'public' })
export class ProductInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'specification', nullable: true })
  specification: string | null;

  @Column('text', { name: 'status', nullable: true })
  status: string | null;

  @Column('integer', { name: 'quantity', default: () => 0 })
  quantity: number;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('text', { name: 'comment', nullable: true })
  comment: string | null;

  @ManyToOne(() => Product, (product) => product.productInventories, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'product_id', referencedColumnName: 'id' }])
  product: Product;
}
