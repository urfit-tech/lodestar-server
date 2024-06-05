import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Card } from './Card';
import { ProgramPlan } from '../../program/entity/ProgramPlan';

@Index('card_product_pkey', ['id'], { unique: true })
@Entity('card_product', { schema: 'public' })
export class CardProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'card_id', unique: false, nullable: false })
  cardId: string;

  @Column('text', { name: 'product_type', unique: false, nullable: false })
  productType: string;

  @Column('uuid', { name: 'target', unique: false, nullable: false })
  target: string;

  @Column('boolean', { name: 'is_deleted' })
  isDeleted: boolean;

  @Column('timestamp with time zone', { name: 'created_at', unique: false, nullable: false, default: () => 'now()' })
  createdAt: Date | null;

  @Column('timestamp with time zone', { name: 'updated_at', unique: false, nullable: true, default: () => 'now()' })
  updatedAt: Date | null;

  @ManyToOne(() => Card, (card) => card.cardProducts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'card_id', referencedColumnName: 'id' }])
  card: Card;

  @ManyToOne(() => ProgramPlan, (programPlan) => programPlan.cardProducts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'target', referencedColumnName: 'id' }])
  programPlan: ProgramPlan;
}
