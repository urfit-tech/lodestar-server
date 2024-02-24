import { v4 } from 'uuid';
import bcrypt from 'bcrypt';
import { Role } from '~/entity/Role';
import { AppPlan } from '~/entity/AppPlan';
import { Category } from '~/definition/entity/category.entity';
import { Property } from '~/definition/entity/property.entity';
import { Tag } from '~/definition/entity/tag.entity';
import { App } from '~/app/entity/app.entity';
import { AppHost } from '~/app/entity/app_host.entity';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { Member } from '~/member/entity/member.entity';
import { Program } from '~/entity/Program';
import { ProgramRole } from '~/entity/ProgramRole';
import { ProgramContentBody } from '~/entity/ProgramContentBody';
import { ProgramContent } from '~/program/entity/program_content.entity';
import { ProgramContentProgress } from '~/entity/ProgramContentProgress';
import { ProgramContentSection } from '~/entity/ProgramContentSection';
import { OrderLog } from '~/order/entity/order_log.entity';
import { OrderProduct } from '~/order/entity/order_product.entity';
import { Product } from '~/entity/Product';
import { ProgramPlan } from '~/entity/ProgramPlan';
import { Currency } from '~/entity/Currency';
import dayjs from 'dayjs';
import { ProgramPackage } from '~/entity/ProgramPackage';
import { ProgramPackagePlan } from '~/entity/ProgramPackagePlan';
import { ProgramPackageProgram } from '~/entity/ProgramPackageProgram';
import { PodcastProgram } from '~/podcast/entity/PodcastProgram';
import { PodcastPlan } from '~/entity/PodcastPlan';
import { PodcastAlbum } from '~/podcast/entity/PodcastAlbum';
import { PodcastAlbumPodcastProgram } from '~/podcast/entity/PodcastAlbumPodcastProgram';
import { PodcastProgramRole } from '~/entity/PodcastProgramRole';
import { Voucher } from '~/voucher/entity/voucher.entity';
import { VoucherCode } from '~/entity/VoucherCode';
import { VoucherPlan } from '~/entity/VoucherPlan';
import { VoucherPlanProduct } from '~/entity/VoucherPlanProduct';
import { CouponPlan } from '~/entity/CouponPlan';
import { CouponCode } from '~/entity/CouponCode';
import { Coupon } from '~/coupon/entity/coupon.entity';
import { CouponPlanProduct } from '~/entity/CouponPlanProduct';
import { MemberNote } from '~/entity/MemberNote';

export const role = new Role();
role.name = 'app-owner';

export const appPlan = new AppPlan();
appPlan.id = v4();
appPlan.name = 'test-plan';
appPlan.description = 'test plan description';

export const app = new App();
app.id = 'test';
app.symbol = 'TST';
app.appPlan = appPlan;

export const appHost = new AppHost();
appHost.appId = app.id;
appHost.host = 'test.something.com';

export const appSetting = new AppSetting();
appSetting.appId = app.id;
appSetting.key = 'auth.service.client_id';
appSetting.value = 'test';

export const appSecret = new AppSecret();
appSecret.appId = app.id;
appSecret.key = 'auth.service.key';
appSecret.value = 'testKey';

export const category = new Category();
category.appId = app.id;
category.class = '';
category.position = 0;
category.name = '測試分類';

export const anotherCategory = new Category();
anotherCategory.appId = app.id;
anotherCategory.class = '';
anotherCategory.position = 0;
anotherCategory.name = 'test-another-category';

export const memberProperty = new Property();
memberProperty.app = app;
memberProperty.type = 'member';
memberProperty.name = 'test-property';

export const memberTag = new Tag();
memberTag.type = 'member';
memberTag.name = 'test-member-tag';

export const anotherMemberTag = new Tag();
anotherMemberTag.type = 'member';
anotherCategory.name = 'test-another-member-tag';

export const member = new Member();
member.id = v4();
member.appId = app.id;
member.email = 'test@example.com';
member.username = 'test';
member.role = role.name;
member.name = 'testMember';
member.passhash = bcrypt.hashSync('test_password', 1);

export const memberNote = new MemberNote();
memberNote.id = v4();
memberNote.authorId = member.id;
memberNote.memberId = member.id;

export const program = new Program();
program.id = v4();
program.title = 'test program';
program.abstract = 'test program abstract';
program.appId = app.id;

export const programPlan = new ProgramPlan();
programPlan.id = v4();
programPlan.programId = program.id;
programPlan.title = 'test program plan';
programPlan.listPrice = 0;

export const programRole = new ProgramRole();
programRole.id = v4();
programRole.name = 'owner';
programRole.memberId = member.id;

export const programContentSection = new ProgramContentSection();
programContentSection.id = v4();
programContentSection.programId = program.id;
programContentSection.title = 'test program content section title';
programContentSection.position = 0;

export const programContentBody = new ProgramContentBody();
programContentBody.id = v4();

export const programContent = new ProgramContent();
programContent.id = v4();
programContent.contentSectionId = programContentSection.id;
programContent.contentBodyId = programContentBody.id;
programContent.title = 'test program content title';
programContent.position = 0;
programContent.displayMode = 'payToWatch';

export const programContentProgress = new ProgramContentProgress();
programContentProgress.id = v4();
programContentProgress.programContentId = programContent.id;
programContentProgress.memberId = member.id;
programContentProgress.progress = 1;
programContentProgress.lastProgress = 1;

export const programPackage = new ProgramPackage();
programPackage.id = v4();
programPackage.title = 'test program package title';
programPackage.appId = app.id;

export const programPackagePlan = new ProgramPackagePlan();
programPackagePlan.id = v4();
programPackagePlan.programPackageId = programPackage.id;
programPackagePlan.isSubscription = false;
programPackagePlan.title = 'test program package plan title';
programPackagePlan.listPrice = 0;
programPackagePlan.position = 0;

export const programPackageProgram = new ProgramPackageProgram();
programPackageProgram.id = v4();
programPackageProgram.programPackageId = programPackage.id;
programPackageProgram.programId = program.id;

export const podcastProgram = new PodcastProgram();
podcastProgram.id = v4();
podcastProgram.title = 'test podcast title';
podcastProgram.creatorId = member.id;

export const podcastPlan = new PodcastPlan();
podcastPlan.id = v4();
podcastPlan.isSubscription = true;
podcastPlan.title = 'test podcast plan title';
podcastPlan.listPrice = 0;
podcastPlan.periodAmount = 1;
podcastPlan.periodType = 'M';
podcastPlan.creatorId = member.id;

export const podcastAlbum = new PodcastAlbum();
podcastAlbum.id = v4();
podcastAlbum.title = 'test podcast album title';
podcastAlbum.authorId = member.id;
podcastAlbum.appId = app.id;

export const podcastAlbumPodcastProgram = new PodcastAlbumPodcastProgram();
podcastAlbumPodcastProgram.id = v4();
podcastAlbumPodcastProgram.podcastAlbumId = podcastAlbum.id;
podcastAlbumPodcastProgram.podcastProgramId = podcastProgram.id;

export const podcastProgramRole = new PodcastProgramRole();
podcastProgramRole.id = v4();
podcastProgramRole.podcastProgramId = podcastProgram.id;
podcastProgramRole.memberId = member.id;
podcastProgramRole.name = 'instructor';

export const orderLog = new OrderLog();
orderLog.id = 'TES1234567890';
orderLog.memberId = member.id;
orderLog.status = 'SUCCESS';
orderLog.appId = app.id;
orderLog.invoiceOptions = {};

export const programPlanProduct = new Product();
programPlanProduct.type = 'ProgramPlan';
programPlanProduct.id = `${programPlanProduct.type}_${programPlan.id}`;
programPlanProduct.target = programPlan.id;

export const programPackagePlanProduct = new Product();
programPackagePlanProduct.type = 'ProgramPackagePlan';
programPackagePlanProduct.id = `${programPackagePlanProduct.type}_${programPackagePlan.id}`;
programPackagePlanProduct.target = programPackagePlan.id;

export const podcastProduct = new Product();
podcastProduct.type = 'PodcastProgram';
podcastProduct.id = `${podcastProduct.type}_${podcastProgram.id}`;
podcastProduct.target = podcastProgram.id;

export const podcastPlanProduct = new Product();
podcastPlanProduct.type = 'PodcastPlan';
podcastPlanProduct.id = `${podcastPlanProduct.type}_${podcastPlan.id}`;
podcastPlanProduct.target = podcastPlan.id;

export const currency = new Currency();
currency.id = 'TWD';
currency.label = '';
currency.unit = '';
currency.name = '';

export const orderProduct = new OrderProduct();
orderProduct.id = v4();
orderProduct.orderId = orderLog.id;
orderProduct.deliveredAt = dayjs().subtract(1, 'day').toDate();

export const voucherPlan = new VoucherPlan();
voucherPlan.id = v4();
voucherPlan.title = 'test voucher plan title';
voucherPlan.description = 'test voucher plan description';
voucherPlan.appId = app.id;
voucherPlan.startedAt = dayjs().toDate();
voucherPlan.endedAt = dayjs().add(1, 'day').toDate();

export const voucherCode = new VoucherCode();
voucherCode.id = v4();
voucherCode.code = 'test voucher code';
voucherCode.count = 10;
voucherCode.remaining = 6;
voucherCode.deletedAt = null;
voucherCode.voucherPlanId = voucherPlan.id;

export const voucher = new Voucher();
voucher.id = v4();
voucher.memberId = member.id;
voucher.voucherCodeId = voucherCode.id;

export const voucherPlanProduct = new VoucherPlanProduct();
voucherPlanProduct.id = v4();
voucherPlanProduct.voucherPlanId = voucherPlan.id;
voucherPlanProduct.productId = programPlanProduct.id;

export const couponPlan = new CouponPlan();
couponPlan.id = v4();
couponPlan.title = 'test coupon plan title';
couponPlan.description = 'test coupon plan description';
couponPlan.startedAt = dayjs().toDate();
couponPlan.endedAt = dayjs().add(1, 'day').toDate();
couponPlan.amount = 1;

export const couponCode = new CouponCode();
couponCode.id = v4();
couponCode.code = 'test coupon code';
couponCode.count = 10;
couponCode.remaining = 6;
couponCode.deletedAt = null;
couponCode.couponPlanId = couponPlan.id;
couponCode.appId = app.id;

export const coupon = new Coupon();
coupon.id = v4();
coupon.memberId = member.id;
coupon.couponCodeId = couponCode.id;

export const couponPlanProduct = new CouponPlanProduct();
couponPlanProduct.id = v4();
couponPlanProduct.couponPlanId = couponPlan.id;
couponPlanProduct.productId = programPlanProduct.id;
