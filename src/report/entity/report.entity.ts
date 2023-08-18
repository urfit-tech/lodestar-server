import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { App } from '~/entity/App';

@Index('report_pkey', ['id'], { unique: true })
@Entity('report', { schema: 'public' })
export class Report {
  @Column('uuid', {
    primary: true,
    name: 'id',
    default: () => 'gen_random_uuid()',
  })
  id: string;

  @Column('text', { name: 'title' })
  title: string;

  @Column('jsonb', { name: 'options', nullable: true })
  options: object | null;

  @Column('text', { name: 'type', nullable: true })
  type: string | null;

  @Column('text', { name: 'app_id' })
  appId: string;

  @ManyToOne(() => App, (app) => app.reports, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App;
}
