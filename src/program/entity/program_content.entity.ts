import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Exercise } from '~/entity/Exercise';
import { Practice } from '~/entity/Practice';
import { ProgramContentAudio } from '~/entity/ProgramContentAudio';
import { ProgramContentBody } from '~/entity/ProgramContentBody';
import { ProgramContentLog } from '~/entity/ProgramContentLog';
import { ProgramContentMaterial } from '~/entity/ProgramContentMaterial';
import { ProgramContentPlan } from '~/entity/ProgramContentPlan';
import { ProgramContentProgress } from '~/entity/ProgramContentProgress';
import { ProgramContentSection } from '~/entity/ProgramContentSection';
import { ProgramContentVideo } from '~/entity/ProgramContentVideo';

import { DisplayMode } from '../program.type';

@Index('program_content_content_section_id', ['contentSectionId'], {})
@Index('program_content_pkey', ['id'], { unique: true })
@Entity('program_content', { schema: 'public' })
export class ProgramContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'content_section_id' })
  contentSectionId: string;

  @Column('uuid', { name: 'content_body_id' })
  contentBodyId: string;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'abstract', nullable: true })
  abstract: string | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'published_at', nullable: true })
  publishedAt: Date | null;

  @Column('integer', { name: 'position' })
  position: number;

  @Column('numeric', { name: 'list_price', nullable: true })
  listPrice: number | null;

  @Column('numeric', { name: 'sale_price', nullable: true })
  salePrice: number | null;

  @Column('timestamp with time zone', { name: 'sold_at', nullable: true })
  soldAt: Date | null;

  @Column('jsonb', { name: 'metadata', nullable: true })
  metadata: object | null;

  @Column('numeric', { name: 'duration', nullable: true })
  duration: number | null;

  @Column('text', { name: 'content_type', nullable: true })
  contentType: string | null;

  @Column('boolean', { name: 'is_notify_update', default: () => false })
  isNotifyUpdate: boolean;

  @Column('timestamp with time zone', { name: 'notified_at', nullable: true })
  notifiedAt: Date | null;

  @Column('text', { name: 'display_mode' })
  displayMode: DisplayMode;

  @OneToMany(() => Exercise, (exercise) => exercise.programContent)
  exercises: Exercise[];

  @OneToMany(() => Practice, (practice) => practice.programContent)
  practices: Practice[];

  @ManyToOne(() => ProgramContentBody, (programContentBody) => programContentBody.programContents, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'content_body_id', referencedColumnName: 'id' }])
  contentBody: ProgramContentBody;

  @ManyToOne(() => ProgramContentSection, (programContentSection) => programContentSection.programContents, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'content_section_id', referencedColumnName: 'id' }])
  contentSection: ProgramContentSection;

  @OneToMany(() => ProgramContentAudio, (programContentAudio) => programContentAudio.programContent)
  programContentAudios: ProgramContentAudio[];

  @OneToMany(() => ProgramContentLog, (programContentLog) => programContentLog.programContent)
  programContentLogs: ProgramContentLog[];

  @OneToMany(() => ProgramContentMaterial, (programContentMaterial) => programContentMaterial.programContent)
  programContentMaterials: ProgramContentMaterial[];

  @OneToMany(() => ProgramContentPlan, (programContentPlan) => programContentPlan.programContent)
  programContentPlans: ProgramContentPlan[];

  @OneToMany(() => ProgramContentProgress, (programContentProgress) => programContentProgress.programContent)
  programContentProgresses: ProgramContentProgress[];

  @OneToMany(() => ProgramContentVideo, (programContentVideo) => programContentVideo.programContent)
  programContentVideos: ProgramContentVideo[];
}
