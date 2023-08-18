import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Index('iszn_coursereply_pkey', ['id'], { unique: true })
@Entity('iszn_coursereply', { schema: 'public' })
export class IsznCoursereply {
  @PrimaryColumn()
  id: string;

  @Column('uuid', { name: 'coursediscussionid' })
  coursediscussionid: string;

  @Column('text', { name: 'userid' })
  userid: string;

  @Column('text', { name: 'content' })
  content: string;

  @Column('timestamp with time zone', { name: 'createdat' })
  createdat: Date;

  @Column('timestamp with time zone', { name: 'updatedat' })
  updatedat: Date;
}
