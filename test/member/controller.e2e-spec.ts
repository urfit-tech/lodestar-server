import jwt from 'jsonwebtoken';
import { v4 } from 'uuid';
import { Queue } from 'bull';
import { EntityManager, Repository } from 'typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';
import request from 'supertest';

import { ApplicationModule } from '~/application.module';
import { ApiExceptionFilter } from '~/api.filter';
import { ImporterTasker } from '~/tasker/importer.tasker';
import { ExporterTasker } from '~/tasker/exporter.tasker';
import { AppPlan } from '~/entity/AppPlan';
import { App } from '~/app/entity/app.entity';
import { AppHost } from '~/app/entity/app_host.entity';
import { Member } from '~/member/entity/member.entity';
import { MemberGetResultDTO } from '~/member/member.dto';

import { Property } from '~/definition/entity/property.entity';
import { MemberProperty } from '~/member/entity/member_property.entity';
import { MemberTag } from '~/member/entity/member_tag.entity';
import { Tag } from '~/definition/entity/tag.entity';
import { MemberPhone } from '~/member/entity/member_phone.entity';
import { Category } from '~/definition/entity/category.entity';
import { MemberCategory } from '~/member/entity/member_category.entity';
import { PermissionGroup } from '~/entity/PermissionGroup';
import { MemberPermissionGroup } from '~/member/entity/member_permission_group.entity';
import { MemberDevice } from '~/member/entity/member_device.entity';

import { app, appHost, appPlan, memberProperty, programPackage, programPackageProgram } from '../data';
import { MemberOauth } from '~/member/entity/member_oauth.entity';
import { MemberPermissionExtra } from '~/entity/MemberPermissionExtra';
import { Permission } from '~/permission/entity/permission.entity';
import { MemberNote } from '~/entity/MemberNote';
import { MemberTask } from '~/entity/MemberTask';
import { ProgramContentProgress } from '~/entity/ProgramContentProgress';
import { ProgramContentLog } from '~/program/entity/ProgramContentLog';
import { Coupon } from '~/coupon/entity/coupon.entity';
import { PaymentLog } from '~/payment/payment_log.entity';
import { Invoice } from '~/invoice/invoice.entity';
import { OrderDiscount } from '~/order/entity/order_discount.entity';
import { OrderLog } from '~/order/entity/order_log.entity';
import { OrderProduct } from '~/order/entity/order_product.entity';
import { Notification } from '~/entity/Notification';
import { ProgramContent } from '~/program/entity/program_content.entity';
import { ProgramContentBody } from '~/entity/ProgramContentBody';
import { ProgramContentSection } from '~/entity/ProgramContentSection';
import { Program } from '~/entity/Program';
import { CouponCode } from '~/entity/CouponCode';
import { CouponPlan } from '~/entity/CouponPlan';
import { Product } from '~/entity/Product';
import { Currency } from '~/entity/Currency';
import { Voucher } from '~/voucher/entity/voucher.entity';
import { VoucherCode } from '~/entity/VoucherCode';
import { VoucherPlan } from '~/entity/VoucherPlan';
import { Exercise } from '~/entity/Exercise';
import { Issue } from '~/entity/Issue';
import { IssueReaction } from '~/entity/IssueReaction';
import { IssueReply } from '~/entity/IssueReply';
import { IssueReplyReaction } from '~/entity/IssueReplyReaction';
import { CommentReaction } from '~/entity/CommentReaction';
import { CommentReply } from '~/entity/CommentReply';
import { CommentReplyReaction } from '~/entity/CommentReplyReaction';
import { Comment } from '~/entity/Comment';
import { MemberCard } from '~/entity/MemberCard';
import { Contract } from '~/entity/Contract';
import { MemberContract } from '~/entity/MemberContract';
import { Review } from '~/entity/Review';
import { ReviewReaction } from '~/entity/ReviewReaction';
import { OrderExecutor } from '~/order/entity/order_executor.entity';
import { OrderContact } from '~/entity/OrderContact';
import { CoinLog } from '~/entity/CoinLog';
import { PodcastProgramProgress } from '~/podcast/entity/PodcastProgramProgress';
import { PodcastProgram } from '~/podcast/entity/PodcastProgram';
import { Post } from '~/entity/Post';
import { PostRole } from '~/entity/PostRole';
import { ProgramPackageProgram } from '~/entity/ProgramPackageProgram';
import { ProgramPackage } from '~/entity/ProgramPackage';
import { ProgramTempoDelivery } from '~/entity/ProgramTempoDelivery';
import { Practice } from '~/entity/Practice';
import { ProgramTimetable } from '~/entity/ProgramTimetable';
import { Attend } from '~/entity/Attend';
import { ReviewReply } from '~/entity/ReviewReply';
import { MemberAuditLog } from '~/member/entity/member_audit_log.entity';

describe('MemberController (e2e)', () => {
  let application: INestApplication;

  let manager: EntityManager;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appHostRepo: Repository<AppHost>;
  let memberRepo: Repository<Member>;
  let propertyRepo: Repository<Property>;
  let tagRepo: Repository<Tag>;
  let categoryRepo: Repository<Category>;
  let permissionGroupRepo: Repository<PermissionGroup>;
  let memberCategoryRepo: Repository<MemberCategory>;
  let memberPropertyRepo: Repository<MemberProperty>;
  let memberTagRepo: Repository<MemberTag>;
  let memberPhoneRepo: Repository<MemberPhone>;
  let memberDeviceRepo: Repository<MemberDevice>;
  let memberPermissionGroupRepo: Repository<MemberPermissionGroup>;
  let memberOauthRepo: Repository<MemberOauth>;
  let permissionRepo: Repository<Permission>;
  let memberPermissionExtraRepo: Repository<MemberPermissionExtra>;
  let memberNoteRepo: Repository<MemberNote>;
  let memberTaskRepo: Repository<MemberTask>;
  let programContentProgressRepo: Repository<ProgramContentProgress>;
  let programContentLogRepo: Repository<ProgramContentLog>;
  let notificationRepo: Repository<Notification>;
  let couponRepo: Repository<Coupon>;
  let paymentLogRepo: Repository<PaymentLog>;
  let invoiceRepo: Repository<Invoice>;
  let orderProductRepo: Repository<OrderProduct>;
  let orderDiscountRepo: Repository<OrderDiscount>;
  let orderLogRepo: Repository<OrderLog>;
  let programContentRepo: Repository<ProgramContent>;
  let programContentBodyRepo: Repository<ProgramContentBody>;
  let programRepo: Repository<Program>;
  let programContentSectionRepo: Repository<ProgramContentSection>;
  let couponCodeRepo: Repository<CouponCode>;
  let couponPlanRepo: Repository<CouponPlan>;
  let productRepo: Repository<Product>;
  let currencyRepo: Repository<Currency>;
  let voucherRepo: Repository<Voucher>;
  let voucherCodeRepo: Repository<VoucherCode>;
  let voucherPlanRepo: Repository<VoucherPlan>;
  let exerciseRepo: Repository<Exercise>;
  let issueReactionRepo: Repository<IssueReaction>;
  let issueRepo: Repository<Issue>;
  let issueReplyRepo: Repository<IssueReply>;
  let issueReplyReactionRepo: Repository<IssueReplyReaction>;
  let commentRepo: Repository<Comment>;
  let commentReactionRepo: Repository<CommentReaction>;
  let commentReplyRepo: Repository<CommentReply>;
  let commentReplyReactionRepo: Repository<CommentReplyReaction>;
  let memberCardRepo: Repository<MemberCard>;
  let contractRepo: Repository<Contract>;
  let memberContractRepo: Repository<MemberContract>;
  let reviewRepo: Repository<Review>;
  let reviewReactionRepo: Repository<ReviewReaction>;
  let reviewReplyRepo: Repository<ReviewReply>;
  let orderExecutorRepo: Repository<OrderExecutor>;
  let orderContractRepo: Repository<OrderContact>;
  let coinLogRepo: Repository<CoinLog>;
  let podcastProgramProgressRepo: Repository<PodcastProgramProgress>;
  let podcastProgramRepo: Repository<PodcastProgram>;
  let postRepo: Repository<Post>;
  let postRoleRepo: Repository<PostRole>;
  let programPackageRepo: Repository<ProgramPackage>;
  let programPackageProgramRepo: Repository<ProgramPackageProgram>;
  let programTempoDeliveryRepo: Repository<ProgramTempoDelivery>;
  let practiceRepo: Repository<Practice>;
  let programTimeableRepo: Repository<ProgramTimetable>;
  let attendRepo: Repository<Attend>;
  let memberAuditLogRepo: Repository<MemberAuditLog>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture.createNestApplication();

    application.useGlobalPipes(new ValidationPipe()).useGlobalFilters(new ApiExceptionFilter());

    manager = application.get<EntityManager>(getEntityManagerToken());
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    appHostRepo = manager.getRepository(AppHost);
    memberRepo = manager.getRepository(Member);
    propertyRepo = manager.getRepository(Property);
    tagRepo = manager.getRepository(Tag);
    categoryRepo = manager.getRepository(Category);
    permissionGroupRepo = manager.getRepository(PermissionGroup);
    memberContractRepo = manager.getRepository(MemberContract);
    contractRepo = manager.getRepository(Contract);
    memberPropertyRepo = manager.getRepository(MemberProperty);
    memberTagRepo = manager.getRepository(MemberTag);
    memberPhoneRepo = manager.getRepository(MemberPhone);
    memberDeviceRepo = manager.getRepository(MemberDevice);
    memberCategoryRepo = manager.getRepository(MemberCategory);
    memberPermissionGroupRepo = manager.getRepository(MemberPermissionGroup);
    memberOauthRepo = manager.getRepository(MemberOauth);
    permissionRepo = manager.getRepository(Permission);
    memberPermissionExtraRepo = manager.getRepository(MemberPermissionExtra);
    memberNoteRepo = manager.getRepository(MemberNote);
    memberTaskRepo = manager.getRepository(MemberTask);
    orderLogRepo = manager.getRepository(OrderLog);
    orderProductRepo = manager.getRepository(OrderProduct);
    orderDiscountRepo = manager.getRepository(OrderDiscount);
    orderContractRepo = manager.getRepository(OrderContact);
    invoiceRepo = manager.getRepository(Invoice);
    paymentLogRepo = manager.getRepository(PaymentLog);
    notificationRepo = manager.getRepository(Notification);
    couponRepo = manager.getRepository(Coupon);
    programPackageRepo = manager.getRepository(ProgramPackage);
    programPackageProgramRepo = manager.getRepository(ProgramPackageProgram);
    programTempoDeliveryRepo = manager.getRepository(ProgramTempoDelivery);
    programContentProgressRepo = manager.getRepository(ProgramContentProgress);
    programContentLogRepo = manager.getRepository(ProgramContentLog);
    programContentRepo = manager.getRepository(ProgramContent);
    programContentBodyRepo = manager.getRepository(ProgramContentBody);
    programRepo = manager.getRepository(Program);
    programContentSectionRepo = manager.getRepository(ProgramContentSection);
    couponCodeRepo = manager.getRepository(CouponCode);
    couponPlanRepo = manager.getRepository(CouponPlan);
    productRepo = manager.getRepository(Product);
    currencyRepo = manager.getRepository(Currency);
    voucherPlanRepo = manager.getRepository(VoucherPlan);
    voucherCodeRepo = manager.getRepository(VoucherCode);
    voucherRepo = manager.getRepository(Voucher);
    exerciseRepo = manager.getRepository(Exercise);
    issueReplyRepo = manager.getRepository(IssueReply);
    issueRepo = manager.getRepository(Issue);
    issueReactionRepo = manager.getRepository(IssueReaction);
    issueReplyReactionRepo = manager.getRepository(IssueReplyReaction);
    commentReplyReactionRepo = manager.getRepository(CommentReplyReaction);
    commentReplyRepo = manager.getRepository(CommentReply);
    commentReactionRepo = manager.getRepository(CommentReaction);
    commentRepo = manager.getRepository(Comment);
    memberCardRepo = manager.getRepository(MemberCard);
    reviewRepo = manager.getRepository(Review);
    reviewReplyRepo = manager.getRepository(ReviewReply);
    reviewReactionRepo = manager.getRepository(ReviewReaction);
    orderExecutorRepo = manager.getRepository(OrderExecutor);
    coinLogRepo = manager.getRepository(CoinLog);
    podcastProgramRepo = manager.getRepository(PodcastProgram);
    podcastProgramProgressRepo = manager.getRepository(PodcastProgramProgress);
    postRepo = manager.getRepository(Post);
    postRoleRepo = manager.getRepository(PostRole);
    practiceRepo = manager.getRepository(Practice);
    programTimeableRepo = manager.getRepository(ProgramTimetable);
    attendRepo = manager.getRepository(Attend);
    memberAuditLogRepo = manager.getRepository(MemberAuditLog);

    await memberAuditLogRepo.delete({});
    await attendRepo.delete({});
    await practiceRepo.delete({});
    await postRoleRepo.delete({});
    await postRepo.delete({});
    await coinLogRepo.delete({});
    await orderContractRepo.delete({});
    await orderExecutorRepo.delete({});
    await reviewReactionRepo.delete({});
    await reviewReplyRepo.delete({});
    await reviewRepo.delete({});
    await commentReplyReactionRepo.delete({});
    await commentReplyRepo.delete({});
    await commentReactionRepo.delete({});
    await commentRepo.delete({});
    await issueReplyReactionRepo.delete({});
    await issueReactionRepo.delete({});
    await issueReplyRepo.delete({});
    await issueRepo.delete({});
    await exerciseRepo.delete({});
    await voucherRepo.delete({});
    await voucherCodeRepo.delete({});
    await voucherPlanRepo.delete({});
    await podcastProgramProgressRepo.delete({});
    await podcastProgramRepo.delete({});
    await programTimeableRepo.delete({});
    await programTempoDeliveryRepo.delete({});
    await programPackageProgramRepo.delete({});
    await programPackageRepo.delete({});
    await programContentLogRepo.delete({});
    await programContentProgressRepo.delete({});
    await programContentRepo.delete({});
    await programContentBodyRepo.delete({});
    await programContentSectionRepo.delete({});
    await programRepo.delete({});
    await paymentLogRepo.delete({});
    await couponRepo.delete({});
    await couponCodeRepo.delete({});
    await couponPlanRepo.delete({});
    await notificationRepo.delete({});
    await invoiceRepo.delete({});
    await orderProductRepo.delete({});
    await productRepo.delete({});
    await orderDiscountRepo.delete({});
    await orderLogRepo.delete({});
    await currencyRepo.delete({});
    await memberContractRepo.delete({});
    await contractRepo.delete({});
    await memberTaskRepo.delete({});
    await memberNoteRepo.delete({});
    await memberPermissionExtraRepo.delete({});
    await permissionRepo.delete({});
    await memberCardRepo.delete({});
    await memberOauthRepo.delete({});
    await memberDeviceRepo.delete({});
    await memberPermissionGroupRepo.delete({});
    await memberPhoneRepo.delete({});
    await memberTagRepo.delete({});
    await memberPropertyRepo.delete({});
    await memberCategoryRepo.delete({});
    await memberRepo.delete({});
    await propertyRepo.delete({});
    await tagRepo.delete({});
    await categoryRepo.delete({});
    await permissionGroupRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});

    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await appHostRepo.save(appHost);

    await application.init();
  });

  afterEach(async () => {
    await memberAuditLogRepo.delete({});
    await attendRepo.delete({});
    await practiceRepo.delete({});
    await postRoleRepo.delete({});
    await postRepo.delete({});
    await coinLogRepo.delete({});
    await orderContractRepo.delete({});
    await orderExecutorRepo.delete({});
    await reviewReactionRepo.delete({});
    await reviewReplyRepo.delete({});
    await reviewRepo.delete({});
    await commentReplyReactionRepo.delete({});
    await commentReplyRepo.delete({});
    await commentReactionRepo.delete({});
    await commentRepo.delete({});
    await issueReplyReactionRepo.delete({});
    await issueReactionRepo.delete({});
    await issueReplyRepo.delete({});
    await issueRepo.delete({});
    await exerciseRepo.delete({});
    await voucherRepo.delete({});
    await voucherCodeRepo.delete({});
    await voucherPlanRepo.delete({});
    await podcastProgramProgressRepo.delete({});
    await podcastProgramRepo.delete({});
    await programTimeableRepo.delete({});
    await programTempoDeliveryRepo.delete({});
    await programPackageProgramRepo.delete({});
    await programPackageRepo.delete({});
    await programContentLogRepo.delete({});
    await programContentProgressRepo.delete({});
    await programContentRepo.delete({});
    await programContentBodyRepo.delete({});
    await programContentSectionRepo.delete({});
    await programRepo.delete({});
    await paymentLogRepo.delete({});
    await couponRepo.delete({});
    await couponCodeRepo.delete({});
    await couponPlanRepo.delete({});
    await notificationRepo.delete({});
    await invoiceRepo.delete({});
    await orderProductRepo.delete({});
    await productRepo.delete({});
    await orderDiscountRepo.delete({});
    await orderLogRepo.delete({});
    await currencyRepo.delete({});
    await memberContractRepo.delete({});
    await contractRepo.delete({});
    await memberTaskRepo.delete({});
    await memberNoteRepo.delete({});
    await memberPermissionExtraRepo.delete({});
    await permissionRepo.delete({});
    await memberCardRepo.delete({});
    await memberOauthRepo.delete({});
    await memberDeviceRepo.delete({});
    await memberPermissionGroupRepo.delete({});
    await memberPhoneRepo.delete({});
    await memberPropertyRepo.delete({});
    await memberTagRepo.delete({});
    await memberCategoryRepo.delete({});
    await memberRepo.delete({});
    await propertyRepo.delete({});
    await tagRepo.delete({});
    await categoryRepo.delete({});
    await permissionGroupRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});

    await application.close();
  });

  describe('/members (GET)', () => {
    const route = '/members';

    it('Should raise unauthorized exception due to incorrect token', async () => {
      await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer something`)
        .set('host', appHost.host)
        .send({
          appId: app.id,
          fileInfos: [],
        })
        .expect(401);
    });

    it('Should raise unauthorized exception due to missing permission', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          memberId: 'invoker_member_id',
          permissions: [],
        },
        jwtSecret,
      );
      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({})
        .expect(401);
      expect(res.body.message).toBe('missing required permission');
    });

    it('Should raise error due to incorrect payload of nextToken & prevToken', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: [],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          option: {
            nextToken: '123',
            prevToken: '456',
          },
        })
        .expect(400);
      expect(res.body.message).toBe('nextToken & prevToken cannot appear in the same request.');
    });

    it('Should get members with empty conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({})
        .expect(200);
      const { data: fetched }: MemberGetResultDTO = res.body;
      const names = fetched.map(({ name }) => name);

      expect(names.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        expect(names.includes(`name${0}`)).toBeTruthy();
      }
    });

    it('Should get members with name conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: { name: '%name%' },
        })
        .expect(200);
      const { data: fetched }: MemberGetResultDTO = res.body;
      const names = fetched.map(({ name }) => name);

      expect(names.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        expect(names.includes(`name${0}`)).toBeTruthy();
      }
    });

    it('Should get members with managerName conditions', async () => {
      const managerMember = new Member();
      managerMember.appId = app.id;
      managerMember.id = v4();
      managerMember.name = 'manager_name';
      managerMember.username = 'manager_username';
      managerMember.email = 'manager_email@example.com';
      managerMember.role = 'general-member';
      managerMember.star = 0;
      managerMember.createdAt = new Date();
      managerMember.loginedAt = new Date();
      await manager.save(managerMember);

      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        insertedMember.manager = managerMember;
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: { managerName: `%${managerMember.name}%` },
        })
        .expect(200);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        const member = fetched[i];
        expect(member.manager_id).toBe(managerMember.id);
      }
    });

    it('Should get members with partial email conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: { email: '%example.com%' },
        })
        .expect(200);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        expect(fetched[i].name.includes(`name${fetched.length - i}`)).toBeTruthy();
        expect(fetched[i].email.includes(`example.com`)).toBeTruthy();
      }
    });

    it('Should get empty members with nested not matched conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            name: '%name%',
            username: '%unable-to-match-condition%',
          },
        })
        .expect(200);
      const { data }: MemberGetResultDTO = res.body;
      expect(data.length).toBe(0);
    });

    it('Should get members with matched nested conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .get(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            name: '%name%',
            username: '%user%',
          },
        })
        .expect(200);
      const { data: fetched }: MemberGetResultDTO = res.body;
      const names = fetched.map(({ name }) => name);

      expect(names.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        expect(names.includes(`name${0}`)).toBeTruthy();
      }
    });

    it('Should get members with matched nested conditions & pagination', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date(new Date().getTime() + i * 1000);
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      let res, data, cursor;
      const names = [];
      do {
        const option = {
          limit: 2,
          ...(cursor && cursor.afterCursor && { nextToken: cursor.afterCursor }),
        };
        res = await request(application.getHttpServer())
          .get(route)
          .set('Authorization', `Bearer ${token}`)
          .set('host', appHost.host)
          .send({
            option,
            condition: {
              name: '%name%',
              username: '%user%',
            },
          })
          .expect(200);
        ({ data, cursor } = res.body);
        expect(data.length).not.toBe(0);
        data.forEach(({ name }) => names.push(name));
      } while (cursor !== null && cursor.afterCursor !== null);
      expect(names).toMatchObject(['name4', 'name3', 'name2', 'name1', 'name0']);
    });
  });

  describe('/members (POST) deprecated soon', () => {
    const route = '/members';

    it('Should raise unauthorized exception due to incorrect token', async () => {
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer something`)
        .set('host', appHost.host)
        .send({
          appId: app.id,
          fileInfos: [],
        })
        .expect(401);
    });

    it('Should raise unauthorized exception due to missing permission', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          memberId: 'invoker_member_id',
          permissions: [],
        },
        jwtSecret,
      );
      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({})
        .expect(401);
      expect(res.body.message).toBe('missing required permission');
    });

    it('Should raise error due to incorrect payload of nextToken & prevToken', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: [],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          option: {
            nextToken: '123',
            prevToken: '456',
          },
        })
        .expect(400);
      expect(res.body.message).toBe('nextToken & prevToken cannot appear in the same request.');
    });

    it('Should get members with empty conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({})
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;
      const names = fetched.map(({ name }) => name);

      expect(names.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        expect(names.includes(`name${0}`)).toBeTruthy();
      }
    });

    it('Should get members with name conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: { name: '%name%' },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;
      const names = fetched.map(({ name }) => name);

      expect(names.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        expect(names.includes(`name${0}`)).toBeTruthy();
      }
    });

    it('Should get members with manager conditions', async () => {
      const managerMember = new Member();
      managerMember.appId = app.id;
      managerMember.id = v4();
      managerMember.name = 'manager_name';
      managerMember.username = 'manager_username';
      managerMember.email = 'manager_email@example.com';
      managerMember.role = 'general-member';
      managerMember.star = 0;
      managerMember.createdAt = new Date();
      managerMember.loginedAt = new Date();
      await manager.save(managerMember);

      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        insertedMember.manager = managerMember;
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: { managerName: `%${managerMember.name}%` },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        const member = fetched[i];
        expect(member.manager_id).toBe(managerMember.id);
      }
    });

    it('Should get single member with full member property condition', async () => {
      const { id: propertyId } = await manager.save(memberProperty);

      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedMemberProperty = new MemberProperty();
        insertedMemberProperty.id = v4();
        insertedMemberProperty.memberId = memberId;
        insertedMemberProperty.propertyId = propertyId;
        insertedMemberProperty.value = `test member property value ${i}`;
        await manager.save(insertedMemberProperty);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            properties: [
              {
                [propertyId]: '%test member property value 1%',
              },
            ],
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(1);
    });

    it('Should get members with partial member property condition', async () => {
      const { id: propertyId } = await manager.save(memberProperty);

      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedMemberProperty = new MemberProperty();
        insertedMemberProperty.id = v4();
        insertedMemberProperty.memberId = memberId;
        insertedMemberProperty.propertyId = propertyId;
        insertedMemberProperty.value = `test member property value ${i}`;
        await manager.save(insertedMemberProperty);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            properties: [
              {
                [propertyId]: '%test member property value%',
              },
            ],
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(5);
    });

    it('Should get single member with member phone condition', async () => {
      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedMemberPhone = new MemberPhone();
        insertedMemberPhone.id = v4();
        insertedMemberPhone.memberId = memberId;
        insertedMemberPhone.phone = `0900000000${i}`;
        await manager.save(insertedMemberPhone);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            phone: '%09000000001%',
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(1);
    });

    it('Should get members with partial member phone condition', async () => {
      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedMemberPhone = new MemberPhone();
        insertedMemberPhone.id = v4();
        insertedMemberPhone.memberId = memberId;
        insertedMemberPhone.phone = `0900000000${i}`;
        await manager.save(insertedMemberPhone);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            phone: '%0000%',
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(5);
    });

    it('Should get single member with member tag condition', async () => {
      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedTag = new Tag();
        insertedTag.name = `tag ${i}`;
        insertedTag.type = 'member';
        await manager.save(insertedTag);

        const insertedMemberTag = new MemberTag();
        insertedMemberTag.id = v4();
        insertedMemberTag.memberId = memberId;
        insertedMemberTag.tagName = insertedTag.name;
        await manager.save(insertedMemberTag);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            tag: '%tag 1%',
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(1);
    });

    it('Should get members with member partial tag condition', async () => {
      const insertedTag = new Tag();
      insertedTag.name = `tag`;
      insertedTag.type = 'member';
      const { name: tagName } = await manager.save(insertedTag);

      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedMemberTag = new MemberTag();
        insertedMemberTag.id = v4();
        insertedMemberTag.memberId = memberId;
        insertedMemberTag.tagName = tagName;
        await manager.save(insertedMemberTag);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            tag: '%tag%',
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(5);
    });

    it('Should get single member with member category condition', async () => {
      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedCategory = new Category();
        insertedCategory.name = `category ${i}`;
        insertedCategory.class = 'member';
        insertedCategory.position = 0;
        insertedCategory.appId = app.id;
        const { id: categoryId } = await manager.save(insertedCategory);

        const insertedMemberCategory = new MemberCategory();
        insertedMemberCategory.id = v4();
        insertedMemberCategory.memberId = memberId;
        insertedMemberCategory.categoryId = categoryId;
        insertedMemberCategory.position = 0;
        await manager.save(insertedMemberCategory);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            category: '%category 1%',
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(1);
    });

    it('Should get single member with member category condition', async () => {
      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedCategory = new Category();
        insertedCategory.name = `category ${i}`;
        insertedCategory.class = 'member';
        insertedCategory.position = 0;
        insertedCategory.appId = app.id;
        const { id: categoryId } = await manager.save(insertedCategory);

        const insertedMemberCategory = new MemberCategory();
        insertedMemberCategory.id = v4();
        insertedMemberCategory.memberId = memberId;
        insertedMemberCategory.categoryId = categoryId;
        insertedMemberCategory.position = 0;
        await manager.save(insertedMemberCategory);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            category: '%category%',
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(5);
    });

    it('Should get single member with member permission group condition', async () => {
      for (let i = 0; i < 5; i++) {
        const memberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = memberId;
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@${i === 0 ? 'aaa.com' : 'example.com'}`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        const insertedPermissionGroup = new PermissionGroup();
        insertedPermissionGroup.name = `test permission group ${i}`;
        insertedPermissionGroup.appId = app.id;
        const { id: permissionGroupId } = await manager.save(insertedPermissionGroup);

        const insertedMemberPermissionGroup = new MemberPermissionGroup();
        insertedMemberPermissionGroup.id = v4();
        insertedMemberPermissionGroup.memberId = memberId;
        insertedMemberPermissionGroup.permissionGroupId = permissionGroupId;
        await manager.save(insertedMemberPermissionGroup);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            permissionGroup: 'test permission group 1',
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;

      expect(fetched.length).toBe(1);
    });

    it('Should get empty members with nested not matched conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            name: '%name%',
            username: '%unable-to-match-condition%',
          },
        })
        .expect(201);
      const { data }: MemberGetResultDTO = res.body;
      expect(data.length).toBe(0);
    });

    it('Should get members with matched nested conditions', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          condition: {
            name: '%name%',
            username: '%user%',
          },
        })
        .expect(201);
      const { data: fetched }: MemberGetResultDTO = res.body;
      const names = fetched.map(({ name }) => name);

      expect(names.length).not.toBe(0);
      for (let i = 0; i < fetched.length; i++) {
        expect(names.includes(`name${0}`)).toBeTruthy();
      }
    });

    it('Should get members with matched nested conditions & pagination', async () => {
      for (let i = 0; i < 5; i++) {
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `name${i}`;
        insertedMember.username = `username${i}`;
        insertedMember.email = `email${i}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date(new Date().getTime() + i * 1000);
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);
      }

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          appId: app.id,
          memberId: 'invoker_member_id',
          permissions: ['MEMBER_ADMIN'],
        },
        jwtSecret,
      );

      let res, data, cursor;
      const names = [];
      do {
        const option = {
          limit: 2,
          ...(cursor && cursor.afterCursor && { nextToken: cursor.afterCursor }),
        };
        res = await request(application.getHttpServer())
          .post(route)
          .set('Authorization', `Bearer ${token}`)
          .set('host', appHost.host)
          .send({
            option,
            condition: {
              name: '%name%',
              username: '%user%',
            },
          })
          .expect(201);
        ({ data, cursor } = res.body);
        expect(data.length).not.toBe(0);
        data.forEach(({ name }) => names.push(name));
      } while (cursor !== null && cursor.afterCursor !== null);
      expect(names).toMatchObject(['name4', 'name3', 'name2', 'name1', 'name0']);
    });
  });

  describe('/members/import (POST)', () => {
    const route = '/members/import';

    it('Should raise unauthorized exception', async () => {
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer something`)
        .set('host', appHost.host)
        .send({
          appId: app.id,
          fileInfos: [],
        })
        .expect(401);
    });

    it('Should raise bad request exception', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          memberId: 'invoker_member_id',
        },
        jwtSecret,
      );
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({})
        .expect(400);
    });

    it('Should insert job into queue', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');
      const importerQueue = application.get<Queue>(getQueueToken(ImporterTasker.name));
      await importerQueue.empty();

      const token = jwt.sign(
        {
          memberId: 'invoker_member_id',
        },
        jwtSecret,
      );
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          appId: app.id,
          fileInfos: [
            {
              key: 'some_key',
              checksum: 'some_checksum',
            },
          ],
        })
        .expect(201);

      const { data } = (await importerQueue.getWaiting())[0];
      expect(data.appId).toBe(app.id);
      expect(data.invokerMemberId).toBe('invoker_member_id');
      expect(data.category).toBe('member');
      expect(data.fileInfos).toStrictEqual([
        {
          checksumETag: 'some_checksum',
          fileName: 'some_key',
        },
      ]);
    });
  });

  describe('/members/export (POST)', () => {
    const route = '/members/export';

    it('Should raise unauthorized exception', async () => {
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', 'Bearer something')
        .set('host', appHost.host)
        .send({
          appId: app.id,
          memberIds: [],
        })
        .expect(401);
    });

    it('Should raise bad request exception', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          memberId: 'invoker_member_id',
        },
        jwtSecret,
      );

      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({})
        .expect(400);
    });

    it('Should insert job into queue', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');
      const exporterQueue = application.get<Queue>(getQueueToken(ExporterTasker.name));
      await exporterQueue.empty();

      const token = jwt.sign(
        {
          memberId: 'invoker_member_id',
        },
        jwtSecret,
      );
      await request(application.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .send({
          appId: app.id,
          memberIds: [],
        })
        .expect(201);

      const { data } = (await exporterQueue.getWaiting())[0];
      expect(data.appId).toBe(app.id);
      expect(data.invokerMemberId).toBe('invoker_member_id');
      expect(data.category).toBe('member');
      expect(data.memberIds).toStrictEqual([]);
    });
  });

  describe('/members/email/:email (DELETE)', () => {
    const route = '/members/email';

    it('Should raise unauthorized exception', async () => {
      const testAuthToken = 'TestTokenWithNoRealCredentials';

      await request(application.getHttpServer())
        .delete(`${route}/no@mail.com`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .set('host', appHost.host)
        .expect(401);
    });

    it('Should raise no permission to delete member exception', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          memberId: 'invoker_member_id',
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .delete(`${route}/no@mail.com`)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .expect(401);

      expect(res.body).toHaveProperty('message');
    });

    it('Should raise no member to delete exception', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          memberId: 'invoker_member_id',
          role: 'app-owner',
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .delete(`${route}/no@mail.com`)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .expect(400);

      expect(res.body).toHaveProperty('code', 'ERROR');
      expect(res.body).toHaveProperty('message');
      console.log(res.body);
    });

    it('should log executor successfully', async () => {
      const memberId = v4();
      const insertedMember = new Member();
      insertedMember.appId = app.id;
      insertedMember.id = memberId;
      insertedMember.name = `name`;
      insertedMember.username = `username`;
      insertedMember.email = `delete@example.com`;
      insertedMember.role = 'general-member';
      insertedMember.star = 0;
      insertedMember.createdAt = new Date();
      insertedMember.loginedAt = new Date();
      await manager.save(insertedMember);

      const executeDeleteMember = new Member();
      executeDeleteMember.appId = app.id;
      executeDeleteMember.id = v4();
      executeDeleteMember.name = `name2`;
      executeDeleteMember.username = `username2`;
      executeDeleteMember.email = `delete2@example.com`;
      executeDeleteMember.role = 'app-owner';
      executeDeleteMember.star = 0;
      executeDeleteMember.createdAt = new Date();
      executeDeleteMember.loginedAt = new Date();
      await manager.save(executeDeleteMember);

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          memberId: executeDeleteMember.id,
          role: 'app-owner',
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .delete(`${route}/${insertedMember.email}`)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .expect(200);

      const memberAudit = await memberAuditLogRepo.findOne({
        where: { memberId: insertedMember.id },
      });
      expect(memberAudit.action).toEqual('delete');
      expect(JSON.parse(memberAudit.target).executorMemberId).toEqual(executeDeleteMember.id);
      expect(JSON.parse(memberAudit.target).executorIpAddress).not.toBeNull;
      expect(JSON.parse(memberAudit.target).executorDateTime).not.toBeNull;
    });

    it('Should delete member successfully', async () => {
      const memberId = v4();
      const insertedMember = new Member();
      insertedMember.appId = app.id;
      insertedMember.id = memberId;
      insertedMember.name = `name`;
      insertedMember.username = `username`;
      insertedMember.email = `delete@example.com`;
      insertedMember.role = 'general-member';
      insertedMember.star = 0;
      insertedMember.createdAt = new Date();
      insertedMember.loginedAt = new Date();
      await manager.save(insertedMember);

      const insertedMember2 = new Member();
      insertedMember2.appId = app.id;
      insertedMember2.id = v4();
      insertedMember2.name = `name2`;
      insertedMember2.username = `username2`;
      insertedMember2.email = `delete2@example.com`;
      insertedMember2.role = 'general-member';
      insertedMember2.star = 0;
      insertedMember2.createdAt = new Date();
      insertedMember2.loginedAt = new Date();
      await manager.save(insertedMember2);

      const insertedTag = new Tag();
      insertedTag.name = `tag`;
      insertedTag.type = 'member';
      await manager.save(insertedTag);

      const insertedMemberTag = new MemberTag();
      insertedMemberTag.id = v4();
      insertedMemberTag.member = insertedMember;
      insertedMemberTag.tagName = insertedTag.name;
      await manager.save(insertedMemberTag);

      const insertedCategory = new Category();
      insertedCategory.name = `category`;
      insertedCategory.class = 'member';
      insertedCategory.position = 0;
      insertedCategory.appId = app.id;
      const { id: categoryId } = await manager.save(insertedCategory);

      const insertedMemberCategory = new MemberCategory();
      insertedMemberCategory.id = v4();
      insertedMemberCategory.member = insertedMember;
      insertedMemberCategory.categoryId = categoryId;
      insertedMemberCategory.position = 0;
      await manager.save(insertedMemberCategory);

      const { id: propertyId } = await manager.save(memberProperty);
      const insertedMemberProperty = new MemberProperty();
      insertedMemberProperty.id = v4();
      insertedMemberProperty.member = insertedMember;
      insertedMemberProperty.propertyId = propertyId;
      insertedMemberProperty.value = `test member property value`;
      await manager.save(insertedMemberProperty);

      const insertedMemberPhone = new MemberPhone();
      insertedMemberPhone.id = v4();
      insertedMemberPhone.member = insertedMember;
      insertedMemberPhone.phone = `09000000000`;
      await manager.save(insertedMemberPhone);

      const insertedMemberDevice = new MemberDevice();
      insertedMemberDevice.id = v4();
      insertedMemberDevice.member = insertedMember;
      insertedMemberDevice.fingerprintId = 'test';
      await manager.save(insertedMemberDevice);

      const insertedMemberOauth = new MemberOauth();
      insertedMemberOauth.id = v4();
      insertedMemberOauth.member = insertedMember;
      insertedMemberOauth.provider = 'cw';
      insertedMemberOauth.providerUserId = 'some_provider_id';
      await manager.save(insertedMemberOauth);

      const insertedPermission = new Permission();
      insertedPermission.id = 'default';
      insertedPermission.description = 'default';
      insertedPermission.group = 'activity';
      await manager.save(insertedPermission);

      const insertedMemberPermissionExtra = new MemberPermissionExtra();
      insertedMemberPermissionExtra.id = v4();
      insertedMemberPermissionExtra.member = insertedMember;
      insertedMemberPermissionExtra.permission = insertedPermission;
      await manager.save(insertedMemberPermissionExtra);

      const insertedMemberNote = new MemberNote();
      insertedMemberNote.member = insertedMember;
      insertedMemberNote.authorId = memberId;
      insertedMemberNote.type = 'outbound';
      insertedMemberNote.status = 'missed';
      await manager.save(insertedMemberNote);

      const insertedMemberTask = new MemberTask();
      insertedMemberTask.member = insertedMember;
      insertedMemberTask.title = 'title';
      insertedMemberTask.priority = 'high';
      insertedMemberTask.status = 'done';
      await manager.save(insertedMemberTask);

      const insertProgramContentBody = new ProgramContentBody();
      insertProgramContentBody.id = v4();
      await manager.save(insertProgramContentBody);

      const insertedProgram = new Program();
      insertedProgram.id = v4();
      insertedProgram.title = 'AAA';
      insertedProgram.appId = 'demo';
      insertedProgram.inAdvance = false;
      insertedProgram.isDeleted = false;
      insertedProgram.appId = app.id;
      await manager.save(insertedProgram);

      const insertProgramContentSection = new ProgramContentSection();
      insertProgramContentSection.id = v4();
      insertProgramContentSection.program = insertedProgram;
      insertProgramContentSection.title = 'QQQ';
      insertProgramContentSection.position = 1;
      await manager.save(insertProgramContentSection);

      const insertedProgramContent = new ProgramContent();
      insertedProgramContent.id = v4();
      insertedProgramContent.title = 'default';
      insertedProgramContent.position = 1;
      insertedProgramContent.contentSectionId = v4();
      insertedProgramContent.displayMode = 'payToWatch';
      insertedProgramContent.contentBody = insertProgramContentBody;
      insertedProgramContent.contentSection = insertProgramContentSection;
      await manager.save(insertedProgramContent);

      const insertedProgramContentProgress = new ProgramContentProgress();
      insertedProgramContentProgress.programContent = insertedProgramContent;
      insertedProgramContentProgress.id = v4();
      insertedProgramContentProgress.member = insertedMember;
      await manager.save(insertedProgramContentProgress);

      const insertedProgramPackage = new ProgramPackage();
      insertedProgramPackage.app = app;
      insertedProgramPackage.isPrivate = false;
      insertedProgramPackage.title = 'AAAA';
      await manager.save(insertedProgramPackage);

      const insertedProgramPackageProgram = new ProgramPackageProgram();
      insertedProgramPackageProgram.program = insertedProgram;
      insertedProgramPackageProgram.position = 1;
      insertedProgramPackageProgram.programPackage = insertedProgramPackage;
      await manager.save(insertedProgramPackageProgram);

      const insertedProgramTempoDelivery = new ProgramTempoDelivery();
      insertedProgramTempoDelivery.member = insertedMember;
      insertedProgramTempoDelivery.programPackageProgram = insertedProgramPackageProgram;
      insertedProgramTempoDelivery.deliveredAt = new Date(11111111);
      await manager.save(insertedProgramTempoDelivery);

      const insertedNotification = new Notification();
      insertedNotification.id = v4();
      insertedNotification.description = 'default';
      insertedNotification.sourceMember = insertedMember;
      insertedNotification.targetMember = insertedMember;
      await manager.save(insertedNotification);

      const insertCouponPlan = new CouponPlan();
      insertCouponPlan.title = 'default';
      insertCouponPlan.amount = 100;
      await manager.save(insertCouponPlan);

      const insertCouponCode = new CouponCode();
      insertCouponCode.appId = app.id;
      insertCouponCode.code = 'default';
      insertCouponCode.count = 1;
      insertCouponCode.couponPlan = insertCouponPlan;
      insertCouponCode.remaining = 100;
      await manager.save(insertCouponCode);

      const insertedCoupon = new Coupon();
      insertedCoupon.id = v4();
      insertedCoupon.member = insertedMember;
      insertedCoupon.couponCode = insertCouponCode;
      await manager.save(insertedCoupon);

      const insertedParentOrderLog = new OrderLog();
      insertedParentOrderLog.id = v4();
      insertedParentOrderLog.appId = app.id;
      insertedParentOrderLog.member = insertedMember;
      insertedParentOrderLog.invoiceOptions = {
        name: 'cc',
        email: 'cc@qraft.app',
        phone: '1111111111',
      };
      insertedParentOrderLog.status = 'SUCCESS';
      await manager.save(insertedParentOrderLog);

      const insertedOrderLog = new OrderLog();
      insertedOrderLog.appId = app.id;
      insertedOrderLog.member = insertedMember;
      insertedOrderLog.parentOrder = insertedParentOrderLog;
      insertedOrderLog.invoiceOptions = {
        name: 'cc',
        email: 'cc@qraft.app',
        phone: '1111111111',
      };
      insertedOrderLog.status = 'SUCCESS';
      await manager.save(insertedOrderLog);

      const insertedOrderDiscount = new OrderDiscount();
      insertedOrderDiscount.id = v4();
      insertedOrderDiscount.name = 'default';
      insertedOrderDiscount.target = v4();
      insertedOrderDiscount.price = 100;
      insertedOrderDiscount.type = 'Coupon';
      insertedOrderDiscount.order = insertedOrderLog;
      await manager.save(insertedOrderDiscount);

      const insertedProduct = new Product();
      insertedProduct.id = v4();
      insertedProduct.type = 'ActivityTicket';
      insertedProduct.target = v4();
      await manager.save(insertedProduct);

      const insertedCurrency = new Currency();
      insertedCurrency.id = 'TWD';
      insertedCurrency.minorUnits = 2;
      insertedCurrency.label = 'default';
      insertedCurrency.unit = 'default';
      insertedCurrency.name = 'default';
      await manager.save(insertedCurrency);

      const insertedOrderProduct = new OrderProduct();
      insertedOrderProduct.id = v4();
      insertedOrderProduct.product = insertedProduct;
      insertedOrderProduct.order = insertedOrderLog;
      insertedOrderProduct.name = 'default';
      insertedOrderProduct.price = 1000;
      insertedOrderProduct.currency = insertedCurrency;
      await manager.save(insertedOrderProduct);

      const insertedInvoice = new Invoice();
      insertedInvoice.order = insertedOrderLog;
      insertedInvoice.price = 1000;
      insertedInvoice.no = 'AA00000001';
      await manager.save(insertedInvoice);

      const insertedPaymentLog = new PaymentLog();
      insertedPaymentLog.order = insertedOrderLog;
      insertedPaymentLog.no = '1555336487636';
      insertedPaymentLog.status = 'SUCCESS';
      insertedPaymentLog.price = 1000;
      await manager.save(insertedPaymentLog);

      const insertedVoucherPlan = new VoucherPlan();
      insertedVoucherPlan.app = app;
      insertedVoucherPlan.title = 'AAA';
      insertedVoucherPlan.description = 'AAA';
      await manager.save(insertedVoucherPlan);

      const insertedVoucherCode = new VoucherCode();
      insertedVoucherCode.voucherPlan = insertedVoucherPlan;
      insertedVoucherCode.count = 1;
      insertedVoucherCode.remaining = 1;
      insertedVoucherCode.code = 'BREVGZJP61EA32E8';

      await manager.save(insertedVoucherCode);

      const insertedVoucher = new Voucher();
      insertedVoucher.member = insertedMember;
      insertedVoucher.voucherCode = insertedVoucherCode;
      await manager.save(insertedVoucher);

      const insertedExercise = new Exercise();
      insertedExercise.member = insertedMember;
      insertedExercise.programContent = insertedProgramContent;
      await manager.save(insertedExercise);

      const insertedIssue = new Issue();
      insertedIssue.member = insertedMember;
      insertedIssue.app = app;
      insertedIssue.threadId = 'SSSSSSSS';
      insertedIssue.title = 'AAA';
      insertedIssue.description = 'AAAA';
      await manager.save(insertedIssue);

      const insertedIssueReaction = new IssueReaction();
      insertedIssueReaction.member = insertedMember;
      insertedIssueReaction.issue = insertedIssue;
      await manager.save(insertedIssueReaction);

      const insertedIssueReply = new IssueReply();
      insertedIssueReply.content = 'aAAa';
      insertedIssueReply.issue = insertedIssue;
      insertedIssueReply.member = insertedMember;
      await manager.save(insertedIssueReply);

      const insertedIssueReplyReaction = new IssueReplyReaction();
      insertedIssueReplyReaction.issueReply = insertedIssueReply;
      insertedIssueReplyReaction.member = insertedMember;
      await manager.save(insertedIssueReplyReaction);

      const insertedComment = new Comment();
      insertedComment.app = app;
      insertedComment.threadId = 'AAAAA';
      insertedComment.member = insertedMember;
      insertedComment.content = 'AAA';
      await manager.save(insertedComment);

      const insertedCommentReply = new CommentReply();
      insertedCommentReply.comment = insertedComment;
      insertedCommentReply.member = insertedMember;
      insertedCommentReply.content = 'AAAA';
      await manager.save(insertedCommentReply);

      const insertedCommentReplyReaction = new CommentReplyReaction();
      insertedCommentReplyReaction.commentReply = insertedCommentReply;
      insertedCommentReplyReaction.member = insertedMember;
      await manager.save(insertedCommentReplyReaction);

      const insertedCommentReaction = new CommentReaction();
      insertedCommentReaction.comment = insertedComment;
      insertedCommentReaction.member = insertedMember;
      await manager.save(insertedCommentReaction);

      const insertedMemberCard = new MemberCard();
      insertedMemberCard.member = insertedMember;
      insertedMemberCard.cardIdentifier = 'AAAAAAAAAA';
      insertedMemberCard.cardInfo = {
        type: 1,
        level: '',
        issuer: '',
        bank_id: '',
        country: 'UNITED KINGDOM',
        funding: 0,
        bin_code: '424242',
        last_four: '4242',
        expiry_date: '202301',
        country_code: 'GB',
        issuer_zh_tw: '',
      };
      insertedMemberCard.cardSecret = {
        card_key: 'AAAAAAAAAA',
        card_token: 'AAAAAAAAAA',
      };
      insertedMemberCard.priority = 0;
      insertedMemberCard.cardHolder = {
        name: 'AAAAAAAAAA',
        email: 'AAAAAAAAAA',
        memberId: 'AAAAAAAAAA',
        phoneNumber: '0999999999',
      };
      await manager.save(insertedMemberCard);

      const insertedContract = new Contract();
      insertedContract.appId = app.id;
      insertedContract.name = '私塾課合約2020';
      insertedContract.description = '私塾課合約2020';
      insertedContract.template = '<div> 1 </div>';
      await manager.save(insertedContract);

      const insertedMemberContract = new MemberContract();
      insertedMemberContract.member = insertedMember;
      insertedMemberContract.contract = insertedContract;
      await manager.save(insertedMemberContract);

      const insertedReview = new Review();
      insertedReview.member = insertedMember;
      insertedReview.appId = app.id;
      insertedReview.score = 100;
      insertedReview.title = 'AAAA';
      insertedReview.path = '/programs/AAAAA';
      await manager.save(insertedReview);

      const insertedReviewReaction = new ReviewReaction();
      insertedReviewReaction.review = insertedReview;
      insertedReviewReaction.member = insertedMember;
      await manager.save(insertedReviewReaction);

      const insertReviewReply = new ReviewReply();
      insertReviewReply.content = 'AAAAA';
      insertReviewReply.memberId = insertedMember.id;
      insertReviewReply.review = insertedReview;
      await manager.save(insertReviewReply);

      const insertedOrderExecutor = new OrderExecutor();
      insertedOrderExecutor.member = insertedMember;
      insertedOrderExecutor.order = insertedOrderLog;
      insertedOrderExecutor.ratio = 1;
      await manager.save(insertedOrderExecutor);

      const insertedOrderContract = new OrderContact();
      insertedOrderContract.member = insertedMember;
      insertedOrderContract.order = insertedOrderLog;
      insertedOrderContract.message = 'AAA';
      insertedOrderContract.message = 'AAAA';
      await manager.save(insertedOrderContract);

      const insertedCoinLog = new CoinLog();
      insertedCoinLog.member = insertedMember;
      insertedCoinLog.title = 'AAAAAA';
      insertedCoinLog.amount = 111;
      insertedCoinLog.description = 'AAAAA';
      await manager.save(insertedCoinLog);

      const insertedPodcastProgram = new PodcastProgram();
      insertedPodcastProgram.title = 'AAAA';
      insertedPodcastProgram.contentType = 'mp3';
      insertedPodcastProgram.creator = insertedMember2;
      insertedPodcastProgram.duration = 1;
      insertedPodcastProgram.durationSecond = 2;
      await manager.save(insertedPodcastProgram);

      const insertedPodcastProgramProgress = new PodcastProgramProgress();
      insertedPodcastProgramProgress.member = insertedMember;
      insertedPodcastProgramProgress.lastProgress = 1.22;
      insertedPodcastProgramProgress.progress = 1.22;
      insertedPodcastProgramProgress.podcastProgram = insertedPodcastProgram;
      await manager.save(insertedPodcastProgramProgress);

      const insertedPost = new Post();
      insertedPost.title = 'AAAA';
      insertedPost.coverUrl = 'AAAA';
      insertedPost.views = 2;
      insertedPost.position = 1;
      insertedPost.isDeleted = false;
      insertedPost.app = app;
      await manager.save(insertedPost);

      const insertedPostRole = new PostRole();
      insertedPostRole.member = insertedMember;
      insertedPostRole.name = 'AAAA';
      insertedPostRole.position = 1;
      insertedPostRole.post = insertedPost;
      await manager.save(insertedPostRole);

      const insertedPratice = new Practice();
      insertedPratice.member = insertedMember;
      insertedPratice.coverUrl = 'AAAAAA';
      insertedPratice.isDeleted = false;
      insertedPratice.programContent = insertedProgramContent;
      insertedPratice.reviewedAt = new Date();
      insertedPratice.title = 'AAAAAA';
      insertedPratice.description = 'AAAAAAAA';
      await manager.save(insertedPratice);

      const insertedProgramTimeable = new ProgramTimetable();
      insertedProgramTimeable.member = insertedMember;
      insertedProgramTimeable.position = 1;
      insertedProgramTimeable.program = insertedProgram;
      insertedProgramTimeable.time = new Date();
      await manager.save(insertedProgramTimeable);

      const insertedAttend = new Attend();
      insertedAttend.member = insertedMember;
      insertedAttend.startedAt = new Date();
      await manager.save(insertedAttend);

      // TODO: add more relations

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = jwt.sign(
        {
          memberId: 'invoker_member_id',
          role: 'app-owner',
        },
        jwtSecret,
      );

      const res = await request(application.getHttpServer())
        .delete(`${route}/delete@example.com`)
        .set('Authorization', `Bearer ${token}`)
        .set('host', appHost.host)
        .expect(200);

      expect(res.body).toHaveProperty('code', 'SUCCESS');
      expect(res.body).toHaveProperty('message');
    });
  });
  describe('members/saleLeadMemberData', () => {
    const route = '/members/saleLeadMemberData';
    describe('Success scenarios', () => {
      it('should return data successfully for a valid request', async () => {
        const memberIds = [];
        for (let i = 0; i < 5; i++) {
          const insertedMember = new Member();
          insertedMember.appId = app.id;
          insertedMember.id = v4();
          insertedMember.name = `name${i}`;
          insertedMember.username = `username${i}`;
          insertedMember.email = `email${i}@example.com`;
          insertedMember.role = 'general-member';
          insertedMember.star = 0;
          insertedMember.createdAt = new Date();
          insertedMember.loginedAt = new Date();
          await manager.save(insertedMember);
          memberIds.push(insertedMember.id);
        }

        const insertedProperty = new Property();
        insertedProperty.appId = app.id;
        insertedProperty.name = 'aaaa';
        insertedProperty.position = 1;
        insertedProperty.type = 'member';
        await manager.save(insertedProperty);

        const insertedCategory = new Category();
        insertedCategory.appId = app.id;
        insertedCategory.name = 'bbbb';
        insertedCategory.class = 'member';
        insertedCategory.position = 1;
        await manager.save(insertedCategory);

        memberIds.map(async (memberId) => {
          const insertedMemberCategory = new MemberCategory();
          insertedMemberCategory.category = insertedCategory;
          insertedMemberCategory.memberId = memberId;
          insertedMemberCategory.position = 1;
          await manager.save(insertedMemberCategory);
        });

        memberIds.map(async (memberId) => {
          const insertedMemberProperty = new MemberProperty();
          insertedMemberProperty.property = insertedProperty;
          insertedMemberProperty.memberId = memberId;
          insertedMemberProperty.value = 'ccccc';
          await manager.save(insertedMemberProperty);
        });

        memberIds.map(async (memberId) => {
          const insertedMemberTask = new MemberTask();
          insertedMemberTask.memberId = memberId;
          insertedMemberTask.title = 'title';
          insertedMemberTask.priority = 'high';
          insertedMemberTask.status = 'done';
          await manager.save(insertedMemberTask);
        });

        memberIds.map(async (memberId, index) => {
          const insertedMemberPhone = new MemberPhone();
          insertedMemberPhone.id = v4();
          insertedMemberPhone.memberId = memberId;
          insertedMemberPhone.phone = `0900000000${index}`;
          await manager.save(insertedMemberPhone);
        });

        memberIds.map(async (memberId) => {
          const insertedMemberNote = new MemberNote();
          insertedMemberNote.memberId = memberId;
          insertedMemberNote.authorId = memberId;
          insertedMemberNote.type = null;
          insertedMemberNote.status = 'missed';
          await manager.save(insertedMemberNote);
        });

        const insertedMemberNote = new MemberNote();
        insertedMemberNote.memberId = memberIds[0];
        insertedMemberNote.authorId = memberIds[0];
        insertedMemberNote.type = 'not null value';
        insertedMemberNote.status = 'missed';
        await manager.save(insertedMemberNote);

        const insertedContract = new Contract();
        insertedContract.appId = app.id;
        insertedContract.name = '私塾課合約2020';
        insertedContract.description = '私塾課合約2020';
        insertedContract.template = '<div> 1 </div>';
        await manager.save(insertedContract);

        memberIds.map(async (memberId) => {
          const insertedMemberContract = new MemberContract();
          insertedMemberContract.memberId = memberId;
          insertedMemberContract.contract = insertedContract;
          insertedMemberContract.agreedAt = new Date();
          await manager.save(insertedMemberContract);
        });

        const jwtSecret = application
          .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
          .getOrThrow('HASURA_JWT_SECRET');

        const token = jwt.sign(
          {
            appId: app.id,
            memberId: 'invoker_member_id',
            permissions: ['MEMBER_ADMIN'],
          },
          jwtSecret,
        );

        const res = await request(application.getHttpServer())
          .post(route)
          .set('Authorization', `Bearer ${token}`)
          .set('host', appHost.host)
          .send({
            memberIds: memberIds,
            appId: app.id,
          })
          .expect(201);

        expect(res.body).toHaveProperty('memberProperty');
        expect(res.body.memberProperty).toHaveLength(5);
        res.body.memberProperty.forEach((property) => {
          expect(property).toHaveProperty('value');
          expect(property).toHaveProperty('name');
          expect(property).toHaveProperty('memberId');
          expect(property).toHaveProperty('propertyId');
          expect(property.value).toEqual('ccccc');
          expect(property.name).toEqual('aaaa');
        });

        expect(res.body).toHaveProperty('memberTask');
        expect(res.body.memberTask).toHaveLength(5);
        res.body.memberTask.forEach((task) => {
          expect(task).toHaveProperty('memberId');
          expect(task).toHaveProperty('status');
          expect(task.status).toEqual('done');
        });

        expect(res.body).toHaveProperty('memberPhone');
        expect(res.body.memberPhone).toHaveLength(5);
        res.body.memberPhone.forEach((phone) => {
          expect(phone).toHaveProperty('memberId');
          expect(phone).toHaveProperty('phone');
          expect(phone.phone).toMatch(/^0900000000\d$/);
        });

        expect(res.body).toHaveProperty('memberNote');
        expect(res.body.memberNote).toHaveLength(5);
        res.body.memberNote.forEach((note) => {
          expect(note).toHaveProperty('memberId');
          expect(note).toHaveProperty('description');
          expect(note.description).toBeNull();
        });

        expect(res.body).toHaveProperty('memberCategory');
        expect(res.body.memberCategory).toHaveLength(5);
        res.body.memberCategory.forEach((category) => {
          expect(category).toHaveProperty('memberId');
          expect(category).toHaveProperty('categoryId');
          expect(category.name).toEqual('bbbb');
          expect(category.categoryId).toBeTruthy();
        });

        expect(res.body).toHaveProperty('activeMemberContract');
        expect(res.body.activeMemberContract).toHaveLength(5);
        res.body.activeMemberContract.forEach((contract) => {
          expect(contract).toHaveProperty('memberId');
          expect(contract).toHaveProperty('agreed_at');
          expect(contract).toHaveProperty('revoked_at');
          expect(contract).toHaveProperty('values');
          expect(contract.agreed_at).toBeTruthy();
          expect(contract.revoked_at).toBeNull();
        });
      });
      it('should handle an empty member list gracefully', async () => {
        const jwtSecret = application
          .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
          .getOrThrow('HASURA_JWT_SECRET');

        const token = jwt.sign(
          {
            appId: app.id,
            memberId: 'invoker_member_id',
            permissions: ['MEMBER_ADMIN'],
          },
          jwtSecret,
        );

        const res = await request(application.getHttpServer())
          .post(route)
          .set('Authorization', `Bearer ${token}`)
          .set('host', appHost.host)
          .send({
            memberIds: [],
            appId: app.id,
          })
          .expect(201);

        expect(res.body).toHaveProperty('memberProperty');
        expect(res.body.memberProperty).toEqual([]);

        expect(res.body).toHaveProperty('memberTask');
        expect(res.body.memberTask).toEqual([]);

        expect(res.body).toHaveProperty('memberPhone');
        expect(res.body.memberPhone).toEqual([]);

        expect(res.body).toHaveProperty('memberNote');
        expect(res.body.memberNote).toEqual([]);

        expect(res.body).toHaveProperty('memberCategory');
        expect(res.body.memberCategory).toEqual([]);

        expect(res.body).toHaveProperty('activeMemberContract');
        expect(res.body.activeMemberContract).toEqual([]);
      });
      it('should return an empty array for memberProperty and memberCategory when there are no properties and categories', async () => {
        const memberIds = [];
        for (let i = 0; i < 5; i++) {
          const insertedMember = new Member();
          insertedMember.appId = app.id;
          insertedMember.id = v4(); // 假设 v4() 是一个 UUID 生成函数
          insertedMember.name = `name${i}`;
          insertedMember.username = `username${i}`;
          insertedMember.email = `email${i}@example.com`;
          insertedMember.role = 'general-member';
          insertedMember.star = 0;
          insertedMember.createdAt = new Date();
          insertedMember.loginedAt = new Date();
          await manager.save(insertedMember);
          memberIds.push(insertedMember.id);
        }
        const jwtSecret = application
          .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
          .getOrThrow('HASURA_JWT_SECRET');

        const token = jwt.sign(
          {
            appId: app.id,
            memberId: 'invoker_member_id',
            permissions: ['MEMBER_ADMIN'],
          },
          jwtSecret,
        );

        const res = await request(application.getHttpServer())
          .post(route)
          .set('Authorization', `Bearer ${token}`)
          .set('host', appHost.host)
          .send({
            memberIds: memberIds,
            appId: app.id,
          })
          .expect(201);

        expect(res.body).toHaveProperty('memberProperty');
        expect(res.body.memberProperty).toEqual([]);
        expect(res.body.memberCategory).toEqual([]);
      });
    });

    describe('Fail scenarios', () => {
      it('should return an error for invalid member IDs type', async () => {
        const jwtSecret = application
          .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
          .getOrThrow('HASURA_JWT_SECRET');

        const token = jwt.sign(
          {
            appId: app.id,
            memberId: 'invoker_member_id',
            permissions: ['MEMBER_ADMIN'],
          },
          jwtSecret,
        );

        const res = await request(application.getHttpServer())
          .post(route)
          .set('Authorization', `Bearer ${token}`)
          .set('host', appHost.host)
          .send({
            memberIds: '',
            appId: app.id,
          })
          .expect(400);

        expect(res.body.message).toEqual(['memberIds must be an array']);
      });
      it('should return an error for missing required fields', async () => {
        const jwtSecret = application
          .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
          .getOrThrow('HASURA_JWT_SECRET');

        const token = jwt.sign(
          {
            appId: app.id,
            memberId: 'invoker_member_id',
            permissions: ['MEMBER_ADMIN'],
          },
          jwtSecret,
        );

        const res = await request(application.getHttpServer())
          .post(route)
          .set('Authorization', `Bearer ${token}`)
          .set('host', appHost.host)
          .expect(400);

        expect(res.body.message).toEqual(['memberIds must be an array', 'appId must be a string']);
      });
      it('should return error when appId is empty', async () => {
        const jwtSecret = application
          .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
          .getOrThrow('HASURA_JWT_SECRET');

        const token = jwt.sign(
          {
            appId: app.id,
            memberId: 'invoker_member_id',
            permissions: ['MEMBER_ADMIN'],
          },
          jwtSecret,
        );

        const res = await request(application.getHttpServer())
          .post(route)
          .set('Authorization', `Bearer ${token}`)
          .set('host', appHost.host)
          .send({
            memberIds: [],
            appId: '',
          })
          .expect(400);

        expect(res.body.message).toEqual('Invalid request parameters');

        expect(res.body.result).toEqual(['appId must be a string and cannot be empty']);
      });
    });
  });
});
