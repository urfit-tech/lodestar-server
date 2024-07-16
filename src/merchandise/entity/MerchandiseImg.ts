import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Merchandise } from './Merchandise';

@Index('merchandise_img_pkey', ['id'], { unique: true })
@Entity('merchandise_img', { schema: 'public' })
export class MerchandiseImg {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'url' })
  url: string;

  @Column('text', { name: 'type' })
  type: string;

  @Column('integer', { name: 'position', default: () => 0 })
  position: number;

  @ManyToOne(() => Merchandise, (merchandise) => merchandise.merchandiseImgs, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'merchandise_id', referencedColumnName: 'id' }])
  merchandise: Merchandise;
}
