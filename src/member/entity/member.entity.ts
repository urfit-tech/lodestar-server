import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { Attachment } from '~/media/attachment.entity';
import { OrderLog } from '~/order/entity/order_log.entity';
import { App } from '~/app/entity/app.entity';
import { Activity } from '~/entity/Activity';
import { AppointmentPlan } from '~/entity/AppointmentPlan';
import { AppPage } from '~/entity/AppPage';
import { AppPageTemplate } from '~/entity/AppPageTemplate';
import { Attend } from '~/entity/Attend';
import { CoinLog } from '~/entity/CoinLog';
import { Comment } from '~/entity/Comment';
import { CommentReaction } from '~/entity/CommentReaction';
import { CommentReply } from '~/entity/CommentReply';
import { CommentReplyReaction } from '~/entity/CommentReplyReaction';
import { Coupon } from '~/coupon/entity/coupon.entity';
import { CreatorCategory } from '~/entity/CreatorCategory';
import { CreatorDisplay } from '~/entity/CreatorDisplay';
import { Exercise } from '~/entity/Exercise';
import { Issue } from '~/entity/Issue';
import { IssueReaction } from '~/entity/IssueReaction';
import { IssueReply } from '~/entity/IssueReply';
import { IssueReplyReaction } from '~/entity/IssueReplyReaction';
import { Media } from '~/entity/Media';
import { MemberCard } from '~/entity/MemberCard';
import { MemberContract } from '~/entity/MemberContract';
import { MemberNote } from '~/entity/MemberNote';
import { MemberPermissionExtra } from '~/entity/MemberPermissionExtra';
import { MemberPermissionGroup } from '~/member/entity/member_permission_group.entity';
import { MemberProperty } from '~/member/entity/member_property.entity';
import { MemberShop } from '~/entity/MemberShop';
import { MemberSocial } from '~/entity/MemberSocial';
import { MemberSpeciality } from '~/entity/MemberSpeciality';
import { MemberTask } from '~/entity/MemberTask';
import { MemberTrackingLog } from '~/entity/MemberTrackingLog';
import { Merchandise } from '~/entity/Merchandise';
import { Notification } from '~/entity/Notification';
import { OrderContact } from '~/entity/OrderContact';
import { OrderExecutor } from '~/order/entity/order_executor.entity';
import { Playlist } from '~/entity/Playlist';
import { Podcast } from '~/entity/Podcast';
import { PodcastAlbum } from '~/podcast/entity/PodcastAlbum';
import { PodcastPlan } from '~/entity/PodcastPlan';
import { PodcastProgram } from '~/podcast/entity/PodcastProgram';
import { PodcastProgramProgress } from '~/podcast/entity/PodcastProgramProgress';
import { PodcastProgramRole } from '~/entity/PodcastProgramRole';
import { PointLog } from '~/entity/PointLog';
import { PostRole } from '~/entity/PostRole';
import { Practice } from '~/entity/Practice';
import { ProgramContentLog } from '~/program/entity/ProgramContentLog';
import { ProgramContentProgress } from '~/entity/ProgramContentProgress';
import { ProgramRole } from '~/entity/ProgramRole';
import { ProgramTempoDelivery } from '~/entity/ProgramTempoDelivery';
import { ProgramTimetable } from '~/entity/ProgramTimetable';
import { ProjectRole } from '~/entity/ProjectRole';
import { QuestionGroup } from '~/entity/QuestionGroup';
import { QuestionLibrary } from '~/entity/QuestionLibrary';
import { Review } from '~/entity/Review';
import { ReviewReaction } from '~/entity/ReviewReaction';
import { Voucher } from '~/voucher/entity/voucher.entity';

import { MemberCategory } from './member_category.entity';
import { MemberDevice } from './member_device.entity';
import { MemberOauth } from './member_oauth.entity';
import { MemberPhone } from './member_phone.entity';
import { MemberTag } from './member_tag.entity';

@Index('member_line_user_id_app_id_key', ['appId', 'lineUserId'], {
  unique: true,
})
@Index('member_app_id_email_key', ['appId', 'email'], { unique: true })
@Index('member_app_id_username_key', ['appId', 'username'], { unique: true })
@Index('member_app_id', ['appId'], {})
@Index('member_created_at_desc_null_last_index', ['createdAt'], {})
@Index('member_created_at_brin_index', ['createdAt'], {})
@Index('User_pkey', ['id'], { unique: true })
@Index('member_refresh_token_key', ['refreshToken'], { unique: true })
@Index('member_zoom_user_id_key', ['zoomUserIdDeprecate'], { unique: true })
@Entity('member', { schema: 'public' })
export class Member {
  @Column('text', { primary: true, name: 'id' })
  id: string;

  @Column('text', { name: 'app_id' })
  appId: string;

  @Column('jsonb', { name: 'roles_deprecated', nullable: true })
  rolesDeprecated: object | null;

  @Column('text', { name: 'name', default: () => "'未命名使用者'" })
  name: string;

  @Column('text', { name: 'email', unique: true })
  email: string;

  @Column('text', { name: 'picture_url', nullable: true })
  pictureUrl: string | null;

  @Column('jsonb', { name: 'metadata', default: () => 'jsonb_build_object()' })
  metadata: object;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null;

  @Column('timestamp with time zone', { name: 'logined_at', nullable: true })
  loginedAt: Date | null;

  @Column('text', { name: 'username', unique: true })
  username: string;

  @Column('text', { name: 'passhash', nullable: true })
  passhash: string | null;

  @Column('text', { name: 'manager_id', nullable: true })
  managerId: string;

  @Column('text', { name: 'facebook_user_id', nullable: true })
  facebookUserId: string | null;

  @Column('text', { name: 'google_user_id', nullable: true })
  googleUserId: string | null;

  @Column('text', { name: 'abstract', nullable: true })
  abstract: string | null;

  @Column('text', { name: 'title', nullable: true })
  title: string | null;

  @Column('text', { name: 'role' })
  role: string;

  @Column('uuid', {
    name: 'refresh_token',
    unique: true,
    default: () => 'gen_random_uuid()',
  })
  refreshToken: string;

  @Column('text', {
    name: 'zoom_user_id_deprecate',
    nullable: true,
    unique: true,
  })
  zoomUserIdDeprecate: string | null;

  @Column('jsonb', { name: 'youtube_channel_ids', nullable: true })
  youtubeChannelIds: object | null;

  @Column('timestamp with time zone', { name: 'assigned_at', nullable: true })
  assignedAt: Date | null;

  @Column('numeric', { name: 'star', nullable: true, default: () => 0 })
  star: number | null;

  @Column('text', { name: 'line_user_id', nullable: true, unique: true })
  lineUserId: string | null;

  @Column('text', { name: 'commonhealth_user_id', nullable: true })
  commonhealthUserId: string | null;

  @Column('timestamp with time zone', {
    name: 'last_member_note_created',
    nullable: true,
  })
  lastMemberNoteCreated: Date | null;

  @Column('text', { name: 'status', default: () => "'verified'" })
  status: string;

  @Column('jsonb', {
    name: 'verified_emails',
    default: () => 'jsonb_build_array()',
  })
  verifiedEmails: object;

  @Column('boolean', { name: 'is_business', default: () => false })
  isBusiness: boolean;

  @OneToMany(() => Activity, (activity) => activity.organizer)
  activities: Activity[];

  @OneToMany(() => AppPage, (appPage) => appPage.editor)
  appPages: AppPage[];

  @OneToMany(() => AppPageTemplate, (appPageTemplate) => appPageTemplate.author)
  appPageTemplates: AppPageTemplate[];

  @OneToMany(() => AppointmentPlan, (appointmentPlan) => appointmentPlan.creator)
  appointmentPlans: AppointmentPlan[];

  @OneToMany(() => Attachment, (attachment) => attachment.author)
  attachments: Attachment[];

  @OneToMany(() => Attend, (attend) => attend.member)
  attends: Attend[];

  @OneToMany(() => CoinLog, (coinLog) => coinLog.member)
  coinLogs: CoinLog[];

  @OneToMany(() => Comment, (comment) => comment.member)
  comments: Comment[];

  @OneToMany(() => CommentReaction, (commentReaction) => commentReaction.member)
  commentReactions: CommentReaction[];

  @OneToMany(() => CommentReply, (commentReply) => commentReply.member)
  commentReplies: CommentReply[];

  @OneToMany(() => CommentReplyReaction, (commentReplyReaction) => commentReplyReaction.member)
  commentReplyReactions: CommentReplyReaction[];

  @OneToMany(() => Coupon, (coupon) => coupon.member)
  coupons: Coupon[];

  @OneToMany(() => CreatorCategory, (creatorCategory) => creatorCategory.creator)
  creatorCategories: CreatorCategory[];

  @OneToMany(() => CreatorDisplay, (creatorDisplay) => creatorDisplay.member)
  creatorDisplays: CreatorDisplay[];

  @OneToMany(() => Exercise, (exercise) => exercise.member)
  exercises: Exercise[];

  @OneToMany(() => Issue, (issue) => issue.member)
  issues: Issue[];

  @OneToMany(() => IssueReaction, (issueReaction) => issueReaction.member)
  issueReactions: IssueReaction[];

  @OneToMany(() => IssueReply, (issueReply) => issueReply.member)
  issueReplies: IssueReply[];

  @OneToMany(() => IssueReplyReaction, (issueReplyReaction) => issueReplyReaction.member)
  issueReplyReactions: IssueReplyReaction[];

  @OneToMany(() => Media, (media) => media.member)
  media: Media[];

  @ManyToOne(() => App, (app) => app.members, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App;

  @ManyToOne(() => Member, (member) => member.members, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'manager_id', referencedColumnName: 'id' }])
  manager: Member;

  @OneToMany(() => Member, (member) => member.manager)
  members: Member[];

  @OneToMany(() => MemberCard, (memberCard) => memberCard.member)
  memberCards: MemberCard[];

  @OneToMany(() => MemberCategory, (memberCategory) => memberCategory.member)
  memberCategories: MemberCategory[];

  @OneToMany(() => MemberContract, (memberContract) => memberContract.author)
  memberContracts: MemberContract[];

  @OneToMany(() => MemberContract, (memberContract) => memberContract.member)
  memberContracts2: MemberContract[];

  @OneToMany(() => MemberDevice, (memberDevice) => memberDevice.member)
  memberDevices: MemberDevice[];

  @OneToMany(() => MemberNote, (memberNote) => memberNote.author)
  memberNotes: MemberNote[];

  @OneToMany(() => MemberNote, (memberNote) => memberNote.member)
  memberNotes2: MemberNote[];

  @OneToMany(() => MemberOauth, (memberOauth) => memberOauth.member)
  memberOauths: MemberOauth[];

  @OneToMany(() => MemberPermissionExtra, (memberPermissionExtra) => memberPermissionExtra.member)
  memberPermissionExtras: MemberPermissionExtra[];

  @OneToMany(() => MemberPermissionGroup, (memberPermissionGroup) => memberPermissionGroup.member)
  memberPermissionGroups: MemberPermissionGroup[];

  @OneToMany(() => MemberPhone, (memberPhone) => memberPhone.member)
  memberPhones: MemberPhone[];

  @OneToMany(() => MemberProperty, (memberProperty) => memberProperty.member, { persistence: false })
  memberProperties: MemberProperty[];

  @OneToMany(() => MemberShop, (memberShop) => memberShop.member)
  memberShops: MemberShop[];

  @OneToMany(() => MemberSocial, (memberSocial) => memberSocial.member)
  memberSocials: MemberSocial[];

  @OneToMany(() => MemberSpeciality, (memberSpeciality) => memberSpeciality.member)
  memberSpecialities: MemberSpeciality[];

  @OneToMany(() => MemberTag, (memberTag) => memberTag.member)
  memberTags: MemberTag[];

  @OneToMany(() => MemberTask, (memberTask) => memberTask.author)
  memberTasks: MemberTask[];

  @OneToMany(() => MemberTask, (memberTask) => memberTask.executor)
  memberTasks2: MemberTask[];

  @OneToMany(() => MemberTask, (memberTask) => memberTask.member)
  memberTasks3: MemberTask[];

  @OneToMany(() => MemberTrackingLog, (memberTrackingLog) => memberTrackingLog.member)
  memberTrackingLogs: MemberTrackingLog[];

  @OneToMany(() => Merchandise, (merchandise) => merchandise.member)
  merchandises: Merchandise[];

  @OneToMany(() => Notification, (notification) => notification.sourceMember)
  notifications: Notification[];

  @OneToMany(() => Notification, (notification) => notification.targetMember)
  notifications2: Notification[];

  @OneToMany(() => OrderContact, (orderContact) => orderContact.member)
  orderContacts: OrderContact[];

  @OneToMany(() => OrderExecutor, (orderExecutor) => orderExecutor.member)
  orderExecutors: OrderExecutor[];

  @OneToMany(() => OrderLog, (orderLog) => orderLog.member)
  orderLogs: OrderLog[];

  @OneToMany(() => Playlist, (playlist) => playlist.member)
  playlists: Playlist[];

  @OneToMany(() => Podcast, (podcast) => podcast.instructor)
  podcasts: Podcast[];

  @OneToMany(() => PodcastAlbum, (podcastAlbum) => podcastAlbum.author)
  podcastAlbums: PodcastAlbum[];

  @OneToMany(() => PodcastPlan, (podcastPlan) => podcastPlan.creator)
  podcastPlans: PodcastPlan[];

  @OneToMany(() => PodcastProgram, (podcastProgram) => podcastProgram.creator)
  podcastPrograms: PodcastProgram[];

  @OneToMany(() => PodcastProgramProgress, (podcastProgramProgress) => podcastProgramProgress.member)
  podcastProgramProgresses: PodcastProgramProgress[];

  @OneToMany(() => PodcastProgramRole, (podcastProgramRole) => podcastProgramRole.member)
  podcastProgramRoles: PodcastProgramRole[];

  @OneToMany(() => PointLog, (pointLog) => pointLog.member)
  pointLogs: PointLog[];

  @OneToMany(() => PostRole, (postRole) => postRole.member)
  postRoles: PostRole[];

  @OneToMany(() => Practice, (practice) => practice.member)
  practices: Practice[];

  @OneToMany(() => ProgramContentLog, (programContentLog) => programContentLog.member)
  programContentLogs: ProgramContentLog[];

  @OneToMany(() => ProgramContentProgress, (programContentProgress) => programContentProgress.member)
  programContentProgresses: ProgramContentProgress[];

  @OneToMany(() => ProgramRole, (programRole) => programRole.member)
  programRoles: ProgramRole[];

  @OneToMany(() => ProgramTempoDelivery, (programTempoDelivery) => programTempoDelivery.member)
  programTempoDeliveries: ProgramTempoDelivery[];

  @OneToMany(() => ProgramTimetable, (programTimetable) => programTimetable.member)
  programTimetables: ProgramTimetable[];

  @OneToMany(() => ProjectRole, (projectRole) => projectRole.member)
  projectRoles: ProjectRole[];

  @OneToMany(() => QuestionGroup, (questionGroup) => questionGroup.modifier)
  questionGroups: QuestionGroup[];

  @OneToMany(() => QuestionLibrary, (questionLibrary) => questionLibrary.modifier)
  questionLibraries: QuestionLibrary[];

  @OneToMany(() => Review, (review) => review.member)
  reviews: Review[];

  @OneToMany(() => ReviewReaction, (reviewReaction) => reviewReaction.member)
  reviewReactions: ReviewReaction[];

  @OneToMany(() => Voucher, (voucher) => voucher.member)
  vouchers: Voucher[];
}
