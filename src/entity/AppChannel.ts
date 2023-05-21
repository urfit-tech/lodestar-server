import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { App } from '~/app/entity/app.entity';

import { ProductChannel } from './ProductChannel';

@Index('app_channel_pkey', ['id'], { unique: true })
@Entity('app_channel', { schema: 'public' })
export class AppChannel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'app_id',
    type: 'text',
  })
  appId: string;

  @Column({
    name: 'name',
    type: 'text',
  })
  name: string;

  @ManyToOne(() => App, app => app.appChannels, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App

  @OneToMany(() => ProductChannel, productChannel => productChannel.appChannel)
  productChannels: ProductChannel[];
}
