import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('post_reaction_pkey', ['id'], { unique: true })
@Entity('post_reaction', { schema: 'public' })
export class PostReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('text', { name: 'member_id' })
  memberId: string;

  @Column('uuid', { name: 'post_id' })
  postId: string;
}
