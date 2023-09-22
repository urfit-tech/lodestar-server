import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { App } from '~/app/entity/app.entity';

@Index('sms_verification_code_pkey', ['id'], { unique: true })
@Entity('sms_verification_code', { schema: 'public' })
export class SmsVerificationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'code' })
  code: string;

  @Column('timestamp with time zone', { name: 'expired_at', nullable: true })
  expiredAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('text', { name: 'phone' })
  phone: string;

  @ManyToOne(() => App, (app) => app.smsVerificationCodes, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App;
}
