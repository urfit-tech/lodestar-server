import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Index('iszn_courseunit_pkey', ['id'], { unique: true })
@Entity('iszn_courseunit', { schema: 'public' })
export class IsznCourseunit {
  @PrimaryColumn()
  id: string;

  @Column('text', { name: 'title' })
  title: string;

  @Column('uuid', { name: 'courseid' })
  courseid: string;

  @Column('integer', { name: 'order' })
  order: number;
}
