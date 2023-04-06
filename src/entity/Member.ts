import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { Activity } from './Activity'
import { App } from './App'
import { AppointmentPlan } from './AppointmentPlan'
import { AppPage } from './AppPage'
import { AppPageTemplate } from './AppPageTemplate'
import { Attachment } from './Attachment'
import { Attend } from './Attend'
import { CoinLog } from './CoinLog'
import { Comment } from './Comment'
import { CommentReaction } from './CommentReaction'
import { CommentReply } from './CommentReply'
import { CommentReplyReaction } from './CommentReplyReaction'
import { Coupon } from './Coupon'
import { CreatorCategory } from './CreatorCategory'
import { CreatorDisplay } from './CreatorDisplay'
import { Exercise } from './Exercise'
import { Issue } from './Issue'
import { IssueReaction } from './IssueReaction'
import { IssueReply } from './IssueReply'
import { IssueReplyReaction } from './IssueReplyReaction'
import { Media } from './Media'
import { MemberCard } from './MemberCard'
import { MemberCategory } from './MemberCategory'
import { MemberContract } from './MemberContract'
import { MemberDevice } from './MemberDevice'
import { MemberNote } from './MemberNote'
import { MemberOauth } from './MemberOauth'
import { MemberPermissionExtra } from './MemberPermissionExtra'
import { MemberPermissionGroup } from './MemberPermissionGroup'
import { MemberPhone } from './MemberPhone'
import { MemberProperty } from './MemberProperty'
import { MemberShop } from './MemberShop'
import { MemberSocial } from './MemberSocial'
import { MemberSpeciality } from './MemberSpeciality'
import { MemberTag } from './MemberTag'
import { MemberTask } from './MemberTask'
import { MemberTrackingLog } from './MemberTrackingLog'
import { Merchandise } from './Merchandise'
import { Notification } from './Notification'
import { OrderContact } from './OrderContact'
import { OrderExecutor } from './OrderExecutor'
import { OrderLog } from './OrderLog'
import { Playlist } from './Playlist'
import { Podcast } from './Podcast'
import { PodcastAlbum } from './PodcastAlbum'
import { PodcastPlan } from './PodcastPlan'
import { PodcastProgram } from './PodcastProgram'
import { PodcastProgramProgress } from './PodcastProgramProgress'
import { PodcastProgramRole } from './PodcastProgramRole'
import { PointLog } from './PointLog'
import { PostRole } from './PostRole'
import { Practice } from './Practice'
import { ProgramContentLog } from './ProgramContentLog'
import { ProgramContentProgress } from './ProgramContentProgress'
import { ProgramRole } from './ProgramRole'
import { ProgramTempoDelivery } from './ProgramTempoDelivery'
import { ProgramTimetable } from './ProgramTimetable'
import { ProjectRole } from './ProjectRole'
import { QuestionGroup } from './QuestionGroup'
import { QuestionLibrary } from './QuestionLibrary'
import { Review } from './Review'
import { ReviewReaction } from './ReviewReaction'
import { Voucher } from './Voucher'

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
  id: string

  @Column('text', { name: 'app_id' })
  appId: string

  @Column('jsonb', { name: 'roles_deprecated', nullable: true })
  rolesDeprecated: object | null

  @Column('text', { name: 'name', default: () => "'未命名使用者'" })
  name: string

  @Column('text', { name: 'email', unique: true })
  email: string

  @Column('text', { name: 'picture_url', nullable: true })
  pictureUrl: string | null

  @Column('jsonb', { name: 'metadata', default: () => 'jsonb_build_object()' })
  metadata: object

  @Column('text', { name: 'description', nullable: true })
  description: string | null

  @Column('timestamp with time zone', {
    name: 'created_at',
    nullable: true,
    default: () => 'now()',
  })
  createdAt: Date | null

  @Column('timestamp with time zone', { name: 'logined_at', nullable: true })
  loginedAt: Date | null

  @Column('text', { name: 'username', unique: true })
  username: string

  @Column('text', { name: 'passhash', nullable: true })
  passhash: string | null

  @Column('text', { name: 'facebook_user_id', nullable: true })
  facebookUserId: string | null

  @Column('text', { name: 'google_user_id', nullable: true })
  googleUserId: string | null

  @Column('text', { name: 'abstract', nullable: true })
  abstract: string | null

  @Column('text', { name: 'title', nullable: true })
  title: string | null

  @Column('text', { name: 'role' })
  role: string

  @Column('uuid', {
    name: 'refresh_token',
    unique: true,
    default: () => 'gen_random_uuid()',
  })
  refreshToken: string

  @Column('text', {
    name: 'zoom_user_id_deprecate',
    nullable: true,
    unique: true,
  })
  zoomUserIdDeprecate: string | null

  @Column('jsonb', { name: 'youtube_channel_ids', nullable: true })
  youtubeChannelIds: object | null

  @Column('timestamp with time zone', { name: 'assigned_at', nullable: true })
  assignedAt: Date | null

  @Column('numeric', { name: 'star', nullable: true, default: () => 0 })
  star: number | null

  @Column('text', { name: 'line_user_id', nullable: true, unique: true })
  lineUserId: string | null

  @Column('text', { name: 'commonhealth_user_id', nullable: true })
  commonhealthUserId: string | null

  @Column('timestamp with time zone', {
    name: 'last_member_note_created',
    nullable: true,
  })
  lastMemberNoteCreated: Date | null

  @Column('text', { name: 'status', default: () => "'verified'" })
  status: string

  @Column('jsonb', {
    name: 'verified_emails',
    default: () => 'jsonb_build_array()',
  })
  verifiedEmails: object

  @Column('boolean', { name: 'is_business', default: () => false })
  isBusiness: boolean

  @OneToMany(() => Activity, activity => activity.organizer)
  activities: Activity[]

  @OneToMany(() => AppPage, appPage => appPage.editor)
  appPages: AppPage[]

  @OneToMany(() => AppPageTemplate, appPageTemplate => appPageTemplate.author)
  appPageTemplates: AppPageTemplate[]

  @OneToMany(() => AppointmentPlan, appointmentPlan => appointmentPlan.creator)
  appointmentPlans: AppointmentPlan[]

  @OneToMany(() => Attachment, attachment => attachment.author)
  attachments: Attachment[]

  @OneToMany(() => Attend, attend => attend.member)
  attends: Attend[]

  @OneToMany(() => CoinLog, coinLog => coinLog.member)
  coinLogs: CoinLog[]

  @OneToMany(() => Comment, comment => comment.member)
  comments: Comment[]

  @OneToMany(() => CommentReaction, commentReaction => commentReaction.member)
  commentReactions: CommentReaction[]

  @OneToMany(() => CommentReply, commentReply => commentReply.member)
  commentReplies: CommentReply[]

  @OneToMany(() => CommentReplyReaction, commentReplyReaction => commentReplyReaction.member)
  commentReplyReactions: CommentReplyReaction[]

  @OneToMany(() => Coupon, coupon => coupon.member)
  coupons: Coupon[]

  @OneToMany(() => CreatorCategory, creatorCategory => creatorCategory.creator)
  creatorCategories: CreatorCategory[]

  @OneToMany(() => CreatorDisplay, creatorDisplay => creatorDisplay.member)
  creatorDisplays: CreatorDisplay[]

  @OneToMany(() => Exercise, exercise => exercise.member)
  exercises: Exercise[]

  @OneToMany(() => Issue, issue => issue.member)
  issues: Issue[]

  @OneToMany(() => IssueReaction, issueReaction => issueReaction.member)
  issueReactions: IssueReaction[]

  @OneToMany(() => IssueReply, issueReply => issueReply.member)
  issueReplies: IssueReply[]

  @OneToMany(() => IssueReplyReaction, issueReplyReaction => issueReplyReaction.member)
  issueReplyReactions: IssueReplyReaction[]

  @OneToMany(() => Media, media => media.member)
  media: Media[]

  @ManyToOne(() => App, app => app.members, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'app_id', referencedColumnName: 'id' }])
  app: App

  @ManyToOne(() => Member, member => member.members, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'manager_id', referencedColumnName: 'id' }])
  manager: Member

  @OneToMany(() => Member, member => member.manager)
  members: Member[]

  @OneToMany(() => MemberCard, memberCard => memberCard.member)
  memberCards: MemberCard[]

  @OneToMany(() => MemberCategory, memberCategory => memberCategory.member)
  memberCategories: MemberCategory[]

  @OneToMany(() => MemberContract, memberContract => memberContract.author)
  memberContracts: MemberContract[]

  @OneToMany(() => MemberContract, memberContract => memberContract.member)
  memberContracts2: MemberContract[]

  @OneToMany(() => MemberDevice, memberDevice => memberDevice.member)
  memberDevices: MemberDevice[]

  @OneToMany(() => MemberNote, memberNote => memberNote.author)
  memberNotes: MemberNote[]

  @OneToMany(() => MemberNote, memberNote => memberNote.member)
  memberNotes2: MemberNote[]

  @OneToMany(() => MemberOauth, memberOauth => memberOauth.member)
  memberOauths: MemberOauth[]

  @OneToMany(() => MemberPermissionExtra, memberPermissionExtra => memberPermissionExtra.member)
  memberPermissionExtras: MemberPermissionExtra[]

  @OneToMany(() => MemberPermissionGroup, memberPermissionGroup => memberPermissionGroup.member)
  memberPermissionGroups: MemberPermissionGroup[]

  @OneToMany(() => MemberPhone, memberPhone => memberPhone.member)
  memberPhones: MemberPhone[]

  @OneToMany(() => MemberProperty, memberProperty => memberProperty.member)
  memberProperties: MemberProperty[]

  @OneToMany(() => MemberShop, memberShop => memberShop.member)
  memberShops: MemberShop[]

  @OneToMany(() => MemberSocial, memberSocial => memberSocial.member)
  memberSocials: MemberSocial[]

  @OneToMany(() => MemberSpeciality, memberSpeciality => memberSpeciality.member)
  memberSpecialities: MemberSpeciality[]

  @OneToMany(() => MemberTag, memberTag => memberTag.member)
  memberTags: MemberTag[]

  @OneToMany(() => MemberTask, memberTask => memberTask.author)
  memberTasks: MemberTask[]

  @OneToMany(() => MemberTask, memberTask => memberTask.executor)
  memberTasks2: MemberTask[]

  @OneToMany(() => MemberTask, memberTask => memberTask.member)
  memberTasks3: MemberTask[]

  @OneToMany(() => MemberTrackingLog, memberTrackingLog => memberTrackingLog.member)
  memberTrackingLogs: MemberTrackingLog[]

  @OneToMany(() => Merchandise, merchandise => merchandise.member)
  merchandises: Merchandise[]

  @OneToMany(() => Notification, notification => notification.sourceMember)
  notifications: Notification[]

  @OneToMany(() => Notification, notification => notification.targetMember)
  notifications2: Notification[]

  @OneToMany(() => OrderContact, orderContact => orderContact.member)
  orderContacts: OrderContact[]

  @OneToMany(() => OrderExecutor, orderExecutor => orderExecutor.member)
  orderExecutors: OrderExecutor[]

  @OneToMany(() => OrderLog, orderLog => orderLog.member)
  orderLogs: OrderLog[]

  @OneToMany(() => Playlist, playlist => playlist.member)
  playlists: Playlist[]

  @OneToMany(() => Podcast, podcast => podcast.instructor)
  podcasts: Podcast[]

  @OneToMany(() => PodcastAlbum, podcastAlbum => podcastAlbum.author)
  podcastAlbums: PodcastAlbum[]

  @OneToMany(() => PodcastPlan, podcastPlan => podcastPlan.creator)
  podcastPlans: PodcastPlan[]

  @OneToMany(() => PodcastProgram, podcastProgram => podcastProgram.creator)
  podcastPrograms: PodcastProgram[]

  @OneToMany(() => PodcastProgramProgress, podcastProgramProgress => podcastProgramProgress.member)
  podcastProgramProgresses: PodcastProgramProgress[]

  @OneToMany(() => PodcastProgramRole, podcastProgramRole => podcastProgramRole.member)
  podcastProgramRoles: PodcastProgramRole[]

  @OneToMany(() => PointLog, pointLog => pointLog.member)
  pointLogs: PointLog[]

  @OneToMany(() => PostRole, postRole => postRole.member)
  postRoles: PostRole[]

  @OneToMany(() => Practice, practice => practice.member)
  practices: Practice[]

  @OneToMany(() => ProgramContentLog, programContentLog => programContentLog.member)
  programContentLogs: ProgramContentLog[]

  @OneToMany(() => ProgramContentProgress, programContentProgress => programContentProgress.member)
  programContentProgresses: ProgramContentProgress[]

  @OneToMany(() => ProgramRole, programRole => programRole.member)
  programRoles: ProgramRole[]

  @OneToMany(() => ProgramTempoDelivery, programTempoDelivery => programTempoDelivery.member)
  programTempoDeliveries: ProgramTempoDelivery[]

  @OneToMany(() => ProgramTimetable, programTimetable => programTimetable.member)
  programTimetables: ProgramTimetable[]

  @OneToMany(() => ProjectRole, projectRole => projectRole.member)
  projectRoles: ProjectRole[]

  @OneToMany(() => QuestionGroup, questionGroup => questionGroup.modifier)
  questionGroups: QuestionGroup[]

  @OneToMany(() => QuestionLibrary, questionLibrary => questionLibrary.modifier)
  questionLibraries: QuestionLibrary[]

  @OneToMany(() => Review, review => review.member)
  reviews: Review[]

  @OneToMany(() => ReviewReaction, reviewReaction => reviewReaction.member)
  reviewReactions: ReviewReaction[]

  @OneToMany(() => Voucher, voucher => voucher.member)
  vouchers: Voucher[]
}
