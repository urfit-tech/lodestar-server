import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { VenueSeat } from './VenueSeat';

@Index('venue_pkey', ['id'], { unique: true })
@Entity('venue', { schema: 'public' })
export class Venue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'name' })
  name: string;

  @Column('integer', { name: 'cols', default: () => 1 })
  cols: number;

  @Column('integer', { name: 'rows', default: () => 1 })
  rows: number;

  @Column('integer', { name: 'seats', default: () => 4 })
  seats: number;

  @Column('text', { name: 'app_id' })
  appId: string;

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

  @Column('timestamp with time zone', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => VenueSeat, (venueSeat) => venueSeat.venue)
  venueSeats: VenueSeat[];
}
