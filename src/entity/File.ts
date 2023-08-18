import { Column, Entity, Index, OneToMany } from 'typeorm';

import { Attachment } from '~/media/attachment.entity';

@Index('file_pkey', ['id'], { unique: true })
@Entity('file', { schema: 'public' })
export class File {
  @Column('uuid', {
    primary: true,
    name: 'id',
    default: () => 'gen_random_uuid()',
  })
  id: string;

  @Column('text', { name: 'name' })
  name: string;

  @Column('text', { name: 'excerpt' })
  excerpt: string;

  @Column('text', { name: 'uri' })
  uri: string;

  @Column('numeric', { name: 'size' })
  size: number;

  @Column('text', { name: 'status' })
  status: string;

  @Column('text', { name: 'checksum' })
  checksum: string;

  @Column('text', { name: 'mime_type' })
  mimeType: string;

  @Column('jsonb', { name: 'metadata', default: () => 'jsonb_build_object()' })
  metadata: object;

  @Column('text', { name: 'thumbnail', nullable: true })
  thumbnail: string | null;

  @Column('text', { name: 'acl', default: () => "'OWNED'" })
  acl: string;

  @Column('integer', { name: 'viewed_count', default: () => 0 })
  viewedCount: number;

  @Column('timestamp with time zone', { name: 'viewed_at', nullable: true })
  viewedAt: Date | null;

  @Column('timestamp with time zone', { name: 'starred_at', nullable: true })
  starredAt: Date | null;

  @Column('text', { name: 'created_by' })
  createdBy: string;

  @Column('text', { name: 'updated_by' })
  updatedBy: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @Column('timestamp with time zone', { name: 'purge_at', nullable: true })
  purgeAt: Date | null;

  @OneToMany(() => Attachment, (attachment) => attachment.file)
  attachments: Attachment[];
}
