import request from 'supertest';
import { EntityManager, Repository } from 'typeorm';
import { v4 } from 'uuid';
import { sign } from 'jsonwebtoken';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getEntityManagerToken } from '@nestjs/typeorm';

import { ApplicationModule } from '~/application.module';
import { Role } from '~/entity/Role';
import { AppPlan } from '~/entity/AppPlan';
import { App } from '~/app/entity/app.entity';
import { AppHost } from '~/app/entity/app_host.entity';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { Member } from '~/member/entity/member.entity';
import { OrderLog } from '~/order/entity/order_log.entity';

import { role, app, appPlan, appSecret, appSetting, appHost } from '../data';
import { ApiExceptionFilter } from '~/api.filter';
import {
  CompleteMultipartUploadDTO,
  CreateMultipartUploadDTO,
  MultipartUploadSignUrlDTO,
  UploadDTO,
} from '~/utility/storage/storage.dto';
import { StorageService } from '~/utility/storage/storage.service';
import { CompletedMultipartUpload } from '@aws-sdk/client-s3';
import { Attachment } from '~/media/attachment.entity';

describe('StorageController (e2e)', () => {
  let application: INestApplication;
  let configService: ConfigService;
  let storageService: StorageService;
  let manager: EntityManager;
  let roleRepo: Repository<Role>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appHostRepo: Repository<AppHost>;
  let appSecretRepo: Repository<AppSecret>;
  let appSettingRepo: Repository<AppSetting>;
  let memberRepo: Repository<Member>;
  let attachmentRepo: Repository<Attachment>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = module.createNestApplication();
    application.useGlobalPipes(new ValidationPipe()).useGlobalFilters(new ApiExceptionFilter());
    configService = application.get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService);
    storageService = application.get<StorageService>(StorageService);

    manager = application.get<EntityManager>(getEntityManagerToken());
    roleRepo = manager.getRepository(Role);
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    appHostRepo = manager.getRepository(AppHost);
    appSecretRepo = manager.getRepository(AppSecret);
    appSettingRepo = manager.getRepository(AppSetting);
    memberRepo = manager.getRepository(Member);
    attachmentRepo = manager.getRepository(Attachment);

    await attachmentRepo.delete({});
    await memberRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await roleRepo.save(role);
    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await appHostRepo.save(appHost);
    await appSecretRepo.save(appSecret);
    await appSettingRepo.save(appSetting);

    await application.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await attachmentRepo.delete({});
    await memberRepo.delete({});
    await appHostRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});
    await application.close();
  });

  describe('/storage/upload (POST)', () => {
    const api = '/storage/storage/upload';

    it('should AuthToken is invalid', async () => {
      const requestBody: UploadDTO = { appId: 'test', fileName: 'test.csv', prefix: 'prefix' };
      const requestHeader = {
        authorization: 'Bearer ' + '',
        host: 'test.something.com',
      };
      await request(application.getHttpServer()).post(api).set(requestHeader).send(requestBody).expect(401);
    });

    it('should get bad request', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = sign(
        {
          memberId: 'invoker_member_id',
        },
        jwtSecret,
      );
      const requestHeader = {
        authorization: 'Bearer ' + token,
        host: 'test.something.com',
      };
      await request(application.getHttpServer()).post(api).set(requestHeader).send().expect(400);
    });

    it('should get get sign url', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = sign(
        {
          memberId: 'invoker_member_id',
        },
        jwtSecret,
      );
      const requestBody: UploadDTO = { appId: 'test', fileName: 'test.csv', prefix: 'prefix' };
      const requestHeader = {
        authorization: 'Bearer ' + token,
        host: 'test.something.com',
      };

      jest
        .spyOn(storageService, 'getSignedUrlForUploadStorage')
        .mockImplementationOnce((appId: string, key: string, prefix: string, expiresIn: number) => {
          return new Promise((resolve) => {
            resolve(`https://aws.sign.url?appId=${appId}&Expires=${expiresIn}&Prefix=${prefix}&key=${key}`);
          });
        });

      const res = await request(application.getHttpServer()).post(api).set(requestHeader).send(requestBody).expect(201);
      expect(res.text).toEqual('https://aws.sign.url?appId=test&Expires=60&Prefix=prefix&key=test.csv');
    });
  });

  describe('/multipart/create (POST)', () => {
    const api = '/storage/multipart/create';
    it('should AuthToken is invalid', async () => {
      const requestHeader = {
        authorization: 'Bearer ' + '',
        host: 'test.something.com',
      };
      await request(application.getHttpServer()).post(api).set(requestHeader).send().expect(401);
    });

    it('should get bad request', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = sign(
        {
          memberId: 'invoker_member_id',
        },
        jwtSecret,
      );

      const requestHeader = {
        authorization: 'Bearer ' + token,
        host: 'test.something.com',
      };

      await request(application.getHttpServer()).post(api).set(requestHeader).send().expect(400);
    });

    it('should create multipart download', async () => {
      const attachmentId = v4();
      const requestBody: CreateMultipartUploadDTO = {
        params: {
          Key: `vod/test/${attachmentId.slice(0, 2)}/${attachmentId}/test.mp4`,
          ContentType: 'video/mp4',
        },
      };

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');

      const token = sign(
        {
          memberId: 'invoker_member_id',
        },
        jwtSecret,
      );

      const requestHeader = {
        authorization: 'Bearer ' + token,
        host: 'test.something.com',
      };

      jest
        .spyOn(storageService, 'createMultipartUpload')
        .mockResolvedValue({ $metadata: null, UploadId: 'uploadId from sdk' });
      const res = await request(application.getHttpServer()).post(api).set(requestHeader).send(requestBody).expect(201);
      expect(res.body).toEqual({ uploadId: 'uploadId from sdk' });
    });
  });

  describe('/multipart/sign-url (POST)', () => {
    const api = '/storage/multipart/sign-url';

    it('should AuthToken is invalid', async () => {
      const requestHeader = {
        authorization: 'Bearer ' + '',
        host: 'test.something.com',
      };

      await request(application.getHttpServer()).post(api).set(requestHeader).send().expect(401);
    });

    it('should get bad request', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');
      const token = sign(
        {
          memberId: 'invoker_member_id',
        },
        jwtSecret,
      );
      const requestHeader = {
        authorization: 'Bearer ' + token,
        host: 'test.something.com',
      };
      await request(application.getHttpServer()).post(api).set(requestHeader).send().expect(400);
    });

    it('should create sign url', async () => {
      const attachmentId = v4();
      const requestBody: MultipartUploadSignUrlDTO = {
        params: {
          Key: `vod/test/${attachmentId.slice(0, 2)}/${attachmentId}/test.mp4`,
          UploadId: 'uploadId from sdk',
          PartNumber: 1,
        },
      };

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');
      const token = sign(
        {
          memberId: 'invoker_member_id',
        },
        jwtSecret,
      );
      const requestHeader = {
        authorization: 'Bearer ' + token,
        host: 'test.something.com',
      };

      jest
        .spyOn(storageService, 'getSignedUrlForUploadPartStorage')
        .mockImplementation((Key: string, UploadId: string, PartNumber: number, expiresIn: number) => {
          return new Promise((resolve) =>
            resolve(
              `https://aws.sign.url/bucket/${Key}?UploadId=${UploadId}&PartNumber=${PartNumber}&ExpiresIn=${expiresIn}`,
            ),
          );
        });

      const res = await request(application.getHttpServer()).post(api).set(requestHeader).send(requestBody).expect(201);

      expect(res.body).toEqual({
        presignedUrl: `https://aws.sign.url/bucket/vod/test/${attachmentId.slice(
          0,
          2,
        )}/${attachmentId}/test.mp4?UploadId=uploadId from sdk&PartNumber=1&ExpiresIn=60`,
      });
    });
  });

  describe('/multipart/complete (POST)', () => {
    const api = '/storage/multipart/complete';

    it('should AuthToken is invalid', async () => {
      const requestHeader = {
        authorization: 'Bearer ' + '',
        host: 'test.something.com',
      };

      await request(application.getHttpServer()).post(api).set(requestHeader).send().expect(401);
    });

    it('should get bad request', async () => {
      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');
      const token = sign(
        {
          memberId: 'invoker_member_id',
        },
        jwtSecret,
      );
      const requestHeader = {
        authorization: 'Bearer ' + token,
        host: 'test.something.com',
      };
      await request(application.getHttpServer()).post(api).set(requestHeader).send().expect(400);
    });

    it('should send completed message to S3 and insert attachment', async () => {
      const insertedAuthor = new Member();
      insertedAuthor.appId = app.id;
      insertedAuthor.id = v4();
      insertedAuthor.name = `author`;
      insertedAuthor.username = `author`;
      insertedAuthor.email = `author@example.com`;
      insertedAuthor.role = 'general-member';
      insertedAuthor.star = 0;
      insertedAuthor.createdAt = new Date();
      insertedAuthor.loginedAt = new Date();
      await manager.save(insertedAuthor);

      const attachmentId = v4();
      const requestBody: CompleteMultipartUploadDTO = {
        params: {
          Key: `vod/demo/${attachmentId.slice(0, 2)}/${attachmentId}/video/test.mp4`,
          UploadId: 'uploadId from sdk',
          MultipartUpload: {
            Parts: [
              {
                PartNumber: 1,
                ETag: '"etag from sdk"',
              },
            ],
          },
        },
        file: {
          name: 'test.mp4',
          type: 'video/mp4',
          size: 10000,
        },
        appId: 'test',
        attachmentId: attachmentId,
        attachmentName: 'test.mp4',
        authorId: insertedAuthor.id,
        duration: 100,
      };

      const jwtSecret = application
        .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
        .getOrThrow('HASURA_JWT_SECRET');
      const token = sign(
        {
          memberId: insertedAuthor.id,
        },
        jwtSecret,
      );
      const requestHeader = {
        authorization: 'Bearer ' + token,
        host: 'test.something.com',
      };

      jest.spyOn(storageService, 'completeMultipartUpload').mockImplementation((Key: string) => {
        return new Promise((resolve) => resolve({ $metadata: null, Location: Key }));
      });

      const res = await request(application.getHttpServer()).post(api).set(requestHeader).send(requestBody).expect(201);

      const attachment = await attachmentRepo.findOneBy({ id: attachmentId });

      expect(attachment.options).toEqual({
        source: {
          s3: {
            video: `s3://bucket/vod/demo/${attachmentId.slice(0, 2)}/${attachmentId}/video/test.mp4`,
          },
        },
      });
      expect(res.body).toEqual({
        location: `vod/demo/${attachmentId.slice(0, 2)}/${attachmentId}/video/test.mp4`,
      });
    });
  });
});
