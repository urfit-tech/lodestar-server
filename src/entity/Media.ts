import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from '~/member/entity/member.entity';

@Index('media_pkey', ['id'], { unique: true })
@Entity('media', { schema: 'public' })
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'resource_url' })
  resourceUrl: string;

  @Column('text', { name: 'name' })
  name: string;

  @Column('text', { name: 'type' })
  type: string;

  @Column('integer', { name: 'size' })
  size: number;

  @Column('jsonb', { name: 'metadata' })
  metadata: object;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(() => Member, (member) => member.media, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'member_id', referencedColumnName: 'id' }])
  member: Member;
}
