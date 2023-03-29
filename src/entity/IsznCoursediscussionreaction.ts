import { Column, Entity, Index, PrimaryColumn } from 'typeorm'

@Index('iszn_coursediscussionreaction_pkey', ['id'], { unique: true })
@Entity('iszn_coursediscussionreaction', { schema: 'public' })
export class IsznCoursediscussionreaction {
  @PrimaryColumn()
  id: string

  @Column('text', { name: 'userid' })
  userid: string

  @Column('uuid', { name: 'coursediscussionid' })
  coursediscussionid: string
}
