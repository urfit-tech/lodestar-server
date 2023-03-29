import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { App } from './App';
import { AppChannel } from './AppChannel';
import { Product } from './Product';

@Index('product_channel_pkey', ['id'], { unique: true })
@Index('product_channel_app_id_channel_sku_key', ['appId', 'channelSku'], { unique: true })
@Index('product_channel_product_id_channel_id_key', ['productId', 'channelId'], { unique: true })
@Unique('product_channel_app_id_channel_sku_key', ['channelSku', 'appId'])
@Unique('product_channel_product_id_channel_id_key', ['productId', 'channelId'])
@Entity('product_channel', { schema: 'public' })
export class ProductChannel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'product_id',
    type: 'text',
  })
  productId: string;

  @Column({
    name: 'channel_id',
    type: 'uuid',
  })
  channelId: string;

  @Column({
    name: 'app_id',
    type: 'text',
  })
  appId: string;

  @Column({
    name: 'channel_sku',
    type: 'text',
    nullable: true,
  })
  channelSku: string;

  @ManyToOne(() => App, app => app.productChannels, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App;

  @ManyToOne(() => AppChannel, appChannel => appChannel.productChannels, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'channel_id', referencedColumnName: 'id' }])
  appChannel: AppChannel;

  @ManyToOne(() => Product, product => product.productChannels, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'product_id', referencedColumnName: 'id' }])
  product: Product;
}