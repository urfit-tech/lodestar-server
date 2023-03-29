import { Column, Entity, Index, PrimaryColumn } from 'typeorm'

@Index('iszn_coursereplyreaction_pkey', ['id'], { unique: true })
@Entity('iszn_coursereplyreaction', { schema: 'public' })
export class IsznCoursereplyreaction {
  @PrimaryColumn()
  id: string

  @Column('text', { name: 'userid' })
  userid: string

  @Column('uuid', { name: 'coursereplyid' })
  coursereplyid: string
}
