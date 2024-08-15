import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Index('temporally_exclusive_resource_rrule_pkey', ['id'], { unique: true })
@Entity('temporally_exclusive_resource_rrule', { schema: 'public' })
export class TemporallyExclusiveResourceRrule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'temporally_exclusive_resource_id' })
    type: string;

    @Column('text', { name: 'rrule' })
    target: string;

    @Column('timestamp with time zone', { name: 'dtstart' })
    dtstart: Date;

    @Column('timestamp with time zone', { name: 'until' })
    until: Date;

    @Column('timestamp with time zone', {
        name: 'created_at',
        default: () => 'now()',
    })
    createdAt: Date;

    @Column('timestamp with time zone', { name: 'update_at', nullable: true })
    updatedAt: Date | null;

}