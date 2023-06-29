import { Activity } from './Activity';
import { ActivityAttendance } from './ActivityAttendance';
import { ActivityCategory } from './ActivityCategory';
import { ActivitySession } from './ActivitySession';
import { ActivitySessionTicket } from './ActivitySessionTicket';
import { ActivityTag } from './ActivityTag';
import { ActivityTicket } from './ActivityTicket';
import { App } from './App';
import { AppAdmin } from './AppAdmin';
import { AppChannel } from './AppChannel';
import { AppDefaultPermission } from './AppDefaultPermission';
import { AppEmailTemplate } from './AppEmailTemplate';
import { AppExtendedModule } from './AppExtendedModule';
import { AppLanguage } from './AppLanguage';
import { AppNav } from './AppNav';
import { AppPage } from './AppPage';
import { AppPageSection } from './AppPageSection';
import { AppPageTemplate } from './AppPageTemplate';
import { AppPlan } from './AppPlan';
import { AppPlanModule } from './AppPlanModule';
import { AppUsage } from './AppUsage';
import { AppWebhook } from './AppWebhook';
import { AppointmentPlan } from './AppointmentPlan';
import { AppointmentSchedule } from './AppointmentSchedule';
import { Attend } from './Attend';
import { AuditLog } from './AuditLog';
import { Bundle } from './Bundle';
import { BundleItem } from './BundleItem';
import { Card } from './Card';
import { CardDiscount } from './CardDiscount';
import { CartItem } from './CartItem';
import { CartProduct } from './CartProduct';
import { Category } from '~/definition/entity/category.entity';;
import { Certificate } from './Certificate';
import { CertificateTemplate } from './CertificateTemplate';
import { CoinLog } from './CoinLog';
import { Comment } from './Comment';
import { CommentReaction } from './CommentReaction';
import { CommentReply } from './CommentReply';
import { CommentReplyReaction } from './CommentReplyReaction';
import { Contract } from './Contract';
import { Coupon } from './Coupon';
import { CouponCode } from './CouponCode';
import { CouponPlan } from './CouponPlan';
import { CouponPlanProduct } from './CouponPlanProduct';
import { CreatorCategory } from './CreatorCategory';
import { CreatorDisplay } from './CreatorDisplay';
import { Currency } from './Currency';
import { EmailTemplate } from './EmailTemplate';
import { Estimator } from './Estimator';
import { Exam } from './Exam';
import { ExamMemberTimeLimit } from './ExamMemberTimeLimit';
import { ExamQuestionGroup } from './ExamQuestionGroup';
import { Exercise } from './Exercise';
import { File } from './File';
import { GiftPlan } from './GiftPlan';
import { GiftPlanProduct } from './GiftPlanProduct';
import { Identity } from './Identity';
import { Issue } from './Issue';
import { IssueReaction } from './IssueReaction';
import { IssueReply } from './IssueReply';
import { IssueReplyReaction } from './IssueReplyReaction';
import { IsznCoupon } from './IsznCoupon';
import { IsznCouponUsage } from './IsznCouponUsage';
import { IsznCoursecontent } from './IsznCoursecontent';
import { IsznCoursediscussion } from './IsznCoursediscussion';
import { IsznCoursediscussionreaction } from './IsznCoursediscussionreaction';
import { IsznCoursereply } from './IsznCoursereply';
import { IsznCoursereplyreaction } from './IsznCoursereplyreaction';
import { IsznCourseunit } from './IsznCourseunit';
import { IsznInvoice } from './IsznInvoice';
import { IsznOrder } from './IsznOrder';
import { IsznOrderItem } from './IsznOrderItem';
import { IsznUser } from './IsznUser';
import { Locale } from './Locale';
import { Media } from './Media';
import { Meet } from './Meet';
import { Member } from '~/member/entity/member.entity';
import { MemberAuditLog } from '~/member/entity/member_audit_log.entity';
import { MemberCard } from './MemberCard';
import { MemberCertificate } from './MemberCertificate';
import { MemberContract } from './MemberContract';
import { MemberDevice } from './MemberDevice';
import { MemberNote } from './MemberNote';
import { MemberOauth } from './MemberOauth';
import { MemberPermissionExtra } from './MemberPermissionExtra';
import { MemberPermissionGroup } from './MemberPermissionGroup';
import { MemberShop } from './MemberShop';
import { MemberSocial } from './MemberSocial';
import { MemberSpeciality } from './MemberSpeciality';
import { MemberTask } from './MemberTask';
import { MemberTrackingLog } from './MemberTrackingLog';
import { Merchandise } from './Merchandise';
import { MerchandiseCategory } from './MerchandiseCategory';
import { MerchandiseFile } from './MerchandiseFile';
import { MerchandiseImg } from './MerchandiseImg';
import { MerchandiseSpec } from './MerchandiseSpec';
import { MerchandiseSpecFile } from './MerchandiseSpecFile';
import { MerchandiseTag } from './MerchandiseTag';
import { Migrations } from './Migrations';
import { Module } from './Module';
import { Notification } from './Notification';
import { OrderContact } from './OrderContact';
import { OrderDiscount } from './OrderDiscount';
import { OrderExecutor } from './OrderExecutor';
import { OrderProductFile } from './OrderProductFile';
import { Org } from './Org';
import { Package } from './Package';
import { PackageItem } from './PackageItem';
import { PackageItemGroup } from './PackageItemGroup';
import { PackageSection } from './PackageSection';
import { Permission } from './Permission';
import { PermissionGroup } from './PermissionGroup';
import { PermissionGroupPermission } from './PermissionGroupPermission';
import { Playlist } from './Playlist';
import { PlaylistPodcastProgram } from './PlaylistPodcastProgram';
import { Podcast } from './Podcast';
import { PodcastAlbum } from './PodcastAlbum';
import { PodcastAlbumCategory } from './PodcastAlbumCategory';
import { PodcastAlbumPodcastProgram } from './PodcastAlbumPodcastProgram';
import { PodcastPlan } from './PodcastPlan';
import { PodcastProgram } from './PodcastProgram';
import { PodcastProgramAudio } from './PodcastProgramAudio';
import { PodcastProgramBody } from './PodcastProgramBody';
import { PodcastProgramCategory } from './PodcastProgramCategory';
import { PodcastProgramProgress } from './PodcastProgramProgress';
import { PodcastProgramRole } from './PodcastProgramRole';
import { PodcastProgramTag } from './PodcastProgramTag';
import { PointLog } from './PointLog';
import { Post } from './Post';
import { PostCategory } from './PostCategory';
import { PostMerchandise } from './PostMerchandise';
import { PostReaction } from './PostReaction';
import { PostRole } from './PostRole';
import { PostTag } from './PostTag';
import { Practice } from './Practice';
import { PracticeReaction } from './PracticeReaction';
import { Product } from './Product';
import { ProductChannel } from './ProductChannel';
import { ProductGiftPlan } from './ProductGiftPlan';
import { ProductInventory } from './ProductInventory';
import { Program } from './Program';
import { ProgramAnnouncement } from './ProgramAnnouncement';
import { ProgramApproval } from './ProgramApproval';
import { ProgramCategory } from './ProgramCategory';
import { ProgramContentAudio } from './ProgramContentAudio';
import { ProgramContentBody } from './ProgramContentBody';
import { ProgramContentExam } from './ProgramContentExam';
import { ProgramContentLog } from './ProgramContentLog';
import { ProgramContentMaterial } from './ProgramContentMaterial';
import { ProgramContentPlan } from './ProgramContentPlan';
import { ProgramContentProgress } from './ProgramContentProgress';
import { ProgramContentSection } from './ProgramContentSection';
import { ProgramContentVideo } from './ProgramContentVideo';
import { ProgramPackage } from './ProgramPackage';
import { ProgramPackageCategory } from './ProgramPackageCategory';
import { ProgramPackagePlan } from './ProgramPackagePlan';
import { ProgramPackageProgram } from './ProgramPackageProgram';
import { ProgramPackageTag } from './ProgramPackageTag';
import { ProgramPlan } from './ProgramPlan';
import { ProgramRelatedItem } from './ProgramRelatedItem';
import { ProgramRole } from './ProgramRole';
import { ProgramTag } from './ProgramTag';
import { ProgramTempoDelivery } from './ProgramTempoDelivery';
import { ProgramTimetable } from './ProgramTimetable';
import { Project } from './Project';
import { ProjectCategory } from './ProjectCategory';
import { ProjectPlan } from './ProjectPlan';
import { ProjectPlanProduct } from './ProjectPlanProduct';
import { ProjectReaction } from './ProjectReaction';
import { ProjectRole } from './ProjectRole';
import { ProjectSection } from './ProjectSection';
import { ProjectTag } from './ProjectTag';
import { Property } from '~/definition/entity/property.entity';;
import { Question } from './Question';
import { QuestionGroup } from './QuestionGroup';
import { QuestionLibrary } from './QuestionLibrary';
import { QuestionOption } from './QuestionOption';
import { Review } from './Review';
import { ReviewReaction } from './ReviewReaction';
import { ReviewReply } from './ReviewReply';
import { Role } from './Role';
import { RolePermission } from './RolePermission';
import { SearchTag } from './SearchTag';
import { Service } from './Service';
import { Setting } from './Setting';
import { SharingCode } from './SharingCode';
import { SignupProperty } from './SignupProperty';
import { SmsVerificationCode } from './SmsVerificationCode';
import { SocialCard } from './SocialCard';
import { SocialCardSubscriber } from './SocialCardSubscriber';
import { Tag } from '~/definition/entity/tag.entity';;
import { Token } from './Token';
import { User } from './User';
import { UserOauth } from './UserOauth';
import { UserPermission } from './UserPermission';
import { Venue } from './Venue';
import { VenueSeat } from './VenueSeat';
import { Voucher } from './Voucher';
import { VoucherCode } from './VoucherCode';
import { VoucherPlan } from './VoucherPlan';
import { VoucherPlanProduct } from './VoucherPlanProduct';
import { WebhookLog } from './WebhookLog';

import { AppHost } from '~/app/entity/app_host.entity';
import { AppModule } from '~/app/entity/app_module.entity';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { Invoice } from '~/invoice/invoice.entity';
import { Attachment } from '~/media/attachment.entity';
import { MemberCategory } from '~/member/entity/member_category.entity';
import { MemberPhone } from '~/member/entity/member_phone.entity';
import { MemberProperty } from '~/member/entity/member_property.entity';
import { MemberTag } from '~/member/entity/member_tag.entity';
import { OrderLog } from '~/order/entity/order_log.entity';
import { OrderProduct } from '~/order/entity/order_product.entity';
import { PaymentLog } from '~/payment/payment_log.entity';
import { ProgramContent } from '~/program/entity/program_content.entity';
import { TableLog } from '~/table_log/table_log.entity';
import { TriggerLog } from '~/trigger/entity/trigger_log.entity';

export const PostgresEntities = [
  Activity,
  ActivityAttendance,
  ActivityCategory,
  ActivitySession,
  ActivitySessionTicket,
  ActivityTag,
  ActivityTicket,
  App,
  AppAdmin,
  AppChannel,
  AppDefaultPermission,
  AppEmailTemplate,
  AppExtendedModule,
  AppHost,
  AppLanguage,
  AppModule,
  AppNav,
  AppPage,
  AppPageSection,
  AppPageTemplate,
  AppPlan,
  AppPlanModule,
  AppSecret,
  AppSetting,
  AppUsage,
  AppWebhook,
  AppointmentPlan,
  AppointmentSchedule,
  Attachment,
  Attend,
  AuditLog,
  Bundle,
  BundleItem,
  Card,
  CardDiscount,
  CartItem,
  CartProduct,
  Category,
  Certificate,
  CertificateTemplate,
  CoinLog,
  Comment,
  CommentReaction,
  CommentReply,
  CommentReplyReaction,
  Contract,
  Coupon,
  CouponCode,
  CouponPlan,
  CouponPlanProduct,
  CreatorCategory,
  CreatorDisplay,
  Currency,
  EmailTemplate,
  Estimator,
  Exam,
  ExamMemberTimeLimit,
  ExamQuestionGroup,
  Exercise,
  File,
  GiftPlan,
  GiftPlanProduct,
  Identity,
  Invoice,
  Issue,
  IssueReaction,
  IssueReply,
  IssueReplyReaction,
  IsznCoupon,
  IsznCouponUsage,
  IsznCoursecontent,
  IsznCoursediscussion,
  IsznCoursediscussionreaction,
  IsznCoursereply,
  IsznCoursereplyreaction,
  IsznCourseunit,
  IsznInvoice,
  IsznOrder,
  IsznOrderItem,
  IsznUser,
  Locale,
  Media,
  Meet,
  Member,
  MemberAuditLog,
  MemberCard,
  MemberCategory,
  MemberCertificate,
  MemberContract,
  MemberDevice,
  MemberNote,
  MemberOauth,
  MemberPermissionExtra,
  MemberPermissionGroup,
  MemberPhone,
  MemberProperty,
  MemberShop,
  MemberSocial,
  MemberSpeciality,
  MemberTag,
  MemberTask,
  MemberTrackingLog,
  Merchandise,
  MerchandiseCategory,
  MerchandiseFile,
  MerchandiseImg,
  MerchandiseSpec,
  MerchandiseSpecFile,
  MerchandiseTag,
  Migrations,
  Module,
  Notification,
  OrderContact,
  OrderDiscount,
  OrderExecutor,
  OrderLog,
  OrderProduct,
  OrderProductFile,
  Org,
  Package,
  PackageItem,
  PackageItemGroup,
  PackageSection,
  PaymentLog,
  Permission,
  PermissionGroup,
  PermissionGroupPermission,
  Playlist,
  PlaylistPodcastProgram,
  Podcast,
  PodcastAlbum,
  PodcastAlbumCategory,
  PodcastAlbumPodcastProgram,
  PodcastPlan,
  PodcastProgram,
  PodcastProgramAudio,
  PodcastProgramBody,
  PodcastProgramCategory,
  PodcastProgramProgress,
  PodcastProgramRole,
  PodcastProgramTag,
  PointLog,
  Post,
  PostCategory,
  PostMerchandise,
  PostReaction,
  PostRole,
  PostTag,
  Practice,
  PracticeReaction,
  Product,
  ProductChannel,
  ProductGiftPlan,
  ProductInventory,
  Program,
  ProgramAnnouncement,
  ProgramApproval,
  ProgramCategory,
  ProgramContent,
  ProgramContentAudio,
  ProgramContentBody,
  ProgramContentExam,
  ProgramContentLog,
  ProgramContentMaterial,
  ProgramContentPlan,
  ProgramContentProgress,
  ProgramContentSection,
  ProgramContentVideo,
  ProgramPackage,
  ProgramPackageCategory,
  ProgramPackagePlan,
  ProgramPackageProgram,
  ProgramPackageTag,
  ProgramPlan,
  ProgramRelatedItem,
  ProgramRole,
  ProgramTag,
  ProgramTempoDelivery,
  ProgramTimetable,
  Project,
  ProjectCategory,
  ProjectPlan,
  ProjectPlanProduct,
  ProjectReaction,
  ProjectRole,
  ProjectSection,
  ProjectTag,
  Property,
  Question,
  QuestionGroup,
  QuestionLibrary,
  QuestionOption,
  Review,
  ReviewReaction,
  ReviewReply,
  Role,
  RolePermission,
  SearchTag,
  Service,
  Setting,
  SharingCode,
  SignupProperty,
  SmsVerificationCode,
  SocialCard,
  SocialCardSubscriber,
  TableLog,
  Tag,
  Token,
  TriggerLog,
  User,
  UserOauth,
  UserPermission,
  Venue,
  VenueSeat,
  Voucher,
  VoucherCode,
  VoucherPlan,
  VoucherPlanProduct,
  WebhookLog,
];
