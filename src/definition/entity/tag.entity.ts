import { Column, Entity, Index, OneToMany, PrimaryColumn } from 'typeorm';

import { MemberTag } from '~/member/entity/member_tag.entity';
import { ActivityTag } from '~/entity/ActivityTag';
import { MemberSpeciality } from '~/entity/MemberSpeciality';
import { MerchandiseTag } from '~/entity/MerchandiseTag';
import { PodcastProgramTag } from '~/entity/PodcastProgramTag';
import { PostTag } from '~/entity/PostTag';
import { ProgramTag } from '~/entity/ProgramTag';

@Index('tag_id_key', ['name'], { unique: true })
@Index('tag_pkey', ['name'], { unique: true })
@Entity('tag', { schema: 'public' })
export class Tag {
  @PrimaryColumn({
    primary: true,
    unique: true,
    type: 'text',
    default: () => 'gen_random_uuid()',
  })
  name: string;

  @Column('text', { name: 'type' })
  type: string;

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

  @Column('boolean', { name: 'filterable', default: () => true })
  filterable: boolean;

  @OneToMany(() => ActivityTag, (activityTag) => activityTag.tagName)
  activityTags: ActivityTag[];

  @OneToMany(() => MemberSpeciality, (memberSpeciality) => memberSpeciality.tagName)
  memberSpecialities: MemberSpeciality[];

  @OneToMany(() => MemberTag, (memberTag) => memberTag.tagName2)
  memberTags: MemberTag[];

  @OneToMany(() => MerchandiseTag, (merchandiseTag) => merchandiseTag.tagName)
  merchandiseTags: MerchandiseTag[];

  @OneToMany(() => PodcastProgramTag, (podcastProgramTag) => podcastProgramTag.tagName2)
  podcastProgramTags: PodcastProgramTag[];

  @OneToMany(() => PostTag, (postTag) => postTag.tagName)
  postTags: PostTag[];

  @OneToMany(() => ProgramTag, (programTag) => programTag.tagName2)
  programTags: ProgramTag[];
}
