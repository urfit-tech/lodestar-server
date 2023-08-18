import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('webhook_log_pkey', ['id'], { unique: true })
@Entity('webhook_log', { schema: 'public' })
export class WebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'event' })
  event: string;

  @Column('text', { name: 'payload' })
  payload: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('text', { name: 'app_id', nullable: true, default: () => "'NULL'" })
  appId: string | null;

  @Column('jsonb', { name: 'detail', nullable: true })
  detail: object | null;
}
