import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TemporallyExclusiveResourceRrule } from './temporally-exclusive-resource-rrule.entity'

@Index('temporally_exclusive_resource_pkey', ['id'], { unique: true })
@Entity('temporally_exclusive_resource', { schema: 'public' })
export class TemporallyExclusiveResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'type' })
  type: string;

  @Column('uuid', { name: 'target' })
  target: string;

  @Column('text', { name: 'app_id' })
  appId: string;

}
