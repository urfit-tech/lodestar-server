import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { App } from '~/app/entity/app.entity';

import { EmailTemplate } from './EmailTemplate';

@Index('app_email_template_app_id_catalog_key', ['appId', 'catalog'], {
  unique: true,
})
@Index('app_email_template_pkey', ['id'], { unique: true })
@Entity('app_email_template', { schema: 'public' })
export class AppEmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'app_id', unique: true })
  appId: string;

  @Column('text', { name: 'catalog', unique: true })
  catalog: string;

  @Column('text', { name: 'subject', nullable: true })
  subject: string | null;

  @ManyToOne(() => App, (app) => app.appEmailTemplates, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App;

  @ManyToOne(() => EmailTemplate, (emailTemplate) => emailTemplate.appEmailTemplates, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'email_template_id', referencedColumnName: 'id' }])
  emailTemplate: EmailTemplate;
}
