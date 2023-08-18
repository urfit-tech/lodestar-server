import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Index('iszn_coursediscussion_pkey', ['id'], { unique: true })
@Entity('iszn_coursediscussion', { schema: 'public' })
export class IsznCoursediscussion {
  @PrimaryColumn()
  id: string;

  @Column('uuid', { name: 'coursecontentid' })
  coursecontentid: string;

  @Column('text', { name: 'userid' })
  userid: string;

  @Column('text', { name: 'content' })
  content: string;

  @Column('timestamp with time zone', { name: 'createdat' })
  createdat: Date;

  @Column('timestamp with time zone', { name: 'updatedat' })
  updatedat: Date;

  @Column('timestamp with time zone', { name: 'solvedat', nullable: true })
  solvedat: Date | null;
}
