import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { App } from '~/app/entity/app.entity';

@Index('app_webhook_pkey', ['id'], { unique: true })
@Entity('app_webhook', { schema: 'public' })
export class AppWebhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'event' })
  event: string;

  @Column('text', { name: 'url' })
  url: string;

  @Column('boolean', { name: 'enabled', default: () => false })
  enabled: boolean;

  @ManyToOne(() => App, (app) => app.appWebhooks, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App;
}
