import request from 'supertest';
import { EntityManager, Repository } from 'typeorm';
import { v4 } from 'uuid';
import { readFileSync } from 'fs';
import { sign } from 'jsonwebtoken';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { sdkStreamMixin } from '@aws-sdk/util-stream-node';

import { ApplicationModule } from '~/application.module';
import { Role } from '~/entity/Role';
import { AppPlan } from '~/entity/AppPlan';
import { App } from '~/app/entity/app.entity';
import { AppHost } from '~/app/entity/app_host.entity';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { AppSetting } from '~/app/entity/app_setting.entity';

import { role, app, appPlan, appSecret, appSetting, appHost } from '../data';
import { ApiExceptionFilter } from '~/api.filter';
import { Attachment } from '~/media/attachment.entity';
import { ProgramContent } from '~/program/entity/program_content.entity';
import { ProgramContentVideo } from '~/entity/ProgramContentVideo';
import { ProgramContentBody } from '~/entity/ProgramContentBody';
import { ProgramContentSection } from '~/entity/ProgramContentSection';
import { Program } from '~/entity/Program';
import { VideoService } from '~/media/video/video.service';
import * as AWScloudfrontSign from 'aws-cloudfront-sign';
import { StorageService } from '~/utility/storage/storage.service';
import {
  DeleteObjectCommandOutput,
  GetObjectCommandInput,
  GetObjectCommandOutput,
  ListObjectsV2CommandOutput,
  ListObjectsV2Request,
  PutObjectAclCommandOutput,
} from '@aws-sdk/client-s3';
import { last } from 'lodash';
import { Readable } from 'stream';

describe('VideoController (e2e)', () => {
  let application: INestApplication;
  let configService: ConfigService;
  let videoService: VideoService;
  let storageService: StorageService;

  let manager: EntityManager;
  let roleRepo: Repository<Role>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appHostRepo: Repository<AppHost>;
  let appSecretRepo: Repository<AppSecret>;
  let appSettingRepo: Repository<AppSetting>;
  let attachmentRepo: Repository<Attachment>;
  let programContentRepo: Repository<ProgramContent>;
  let programContentVideoRepo: Repository<ProgramContentVideo>;
  let programContentBodyRepo: Repository<ProgramContentBody>;
  let programContentSectionRepo: Repository<ProgramContentSection>;
  let programRepo: Repository<Program>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = module.createNestApplication();
    application.useGlobalPipes(new ValidationPipe()).useGlobalFilters(new ApiExceptionFilter());
    configService = application.get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService);
    videoService = application.get<VideoService>(VideoService);
    storageService = application.get<StorageService>(StorageService);

    manager = application.get<EntityManager>(getEntityManagerToken());
    roleRepo = manager.getRepository(Role);
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    appHostRepo = manager.getRepository(AppHost);
    appSecretRepo = manager.getRepository(AppSecret);
    appSettingRepo = manager.getRepository(AppSetting);
    attachmentRepo = manager.getRepository(Attachment);
    programContentRepo = manager.getRepository(ProgramContent);
    programContentVideoRepo = manager.getRepository(ProgramContentVideo);
    programContentBodyRepo = manager.getRepository(ProgramContentBody);
    programContentSectionRepo = manager.getRepository(ProgramContentSection);
    programRepo = manager.getRepository(Program);

    await programContentVideoRepo.delete({});
    await programContentRepo.delete({});
    await programContentBodyRepo.delete({});
    await programContentSectionRepo.delete({});
    await programRepo.delete({});
    await attachmentRepo.delete({});
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
    await programContentVideoRepo.delete({});
    await programContentRepo.delete({});
    await programContentBodyRepo.delete({});
    await programContentSectionRepo.delete({});
    await programRepo.delete({});
    await attachmentRepo.delete({});
    await appHostRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});
    await application.close();
  });

  describe('/videos/sign (GET)', () => {
    beforeEach(() => {
      jest.spyOn(AWScloudfrontSign, 'getSignedUrl').mockImplementation((url: string) => {
        return `${url}?Key-Pair-Id=id&Expires=time&Policy=policy&Signature=signature`;
      });

      jest.spyOn(videoService, 'getCaptions').mockImplementation(() => {
        return new Promise((resolve) => resolve([]));
      });
    });

    const attachment = new Attachment();
    attachment.id = v4();
    attachment.appId = 'test';
    attachment.options = {
      cloudfront: {
        path: `https://test-dev.kolable.com/vod-cf/test/${attachment.id.slice(0, 2)}/${
          attachment.id
        }/mockcfuid/manifest/test.m3u8`,
        playPaths: {
          hls: `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/hls/test.m3u8`,
          dash: `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/dash/test.mpd`,
        },
      },
    };

    const programContentBody = new ProgramContentBody();
    programContentBody.id = v4();

    const program = new Program();
    program.title = 'test video program';
    program.appId = 'test';
    program.id = v4();

    const programContentSection = new ProgramContentSection();
    programContentSection.id = v4();
    programContentSection.program = program;
    programContentSection.title = 'test video program content section';
    programContentSection.position = 0;

    const programContent = new ProgramContent();
    programContent.id = v4();
    programContent.displayMode = 'trial';
    programContent.title = 'test video program';
    programContent.position = 0;
    programContent.contentBody = programContentBody;
    programContent.contentSection = programContentSection;

    const programContentVideo = new ProgramContentVideo();
    programContentVideo.id = v4();
    programContentVideo.attachment = attachment;
    programContentVideo.programContent = programContent;

    it('should AuthToken is invalid', async () => {
      const requestHeader = {
        authorization: 'Bearer ' + '',
        host: 'test.something.com',
      };

      await request(application.getHttpServer())
        .get(`/videos/${attachment.id}/sign`)
        .set(requestHeader)
        .send()
        .expect(400);
    });

    it('should get get sign urls', async () => {
      await attachmentRepo.save(attachment);
      await programRepo.save(program);
      await programContentBodyRepo.save(programContentBody);
      await programContentSectionRepo.save(programContentSection);
      await programContentRepo.save(programContent);
      await programContentVideoRepo.save(programContentVideo);

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

      const res = await request(application.getHttpServer())
        .get(`/videos/${attachment.id}/sign`)
        .set(requestHeader)
        .expect(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('code');
      expect(res.body).toHaveProperty('result');
      expect(res.body.result).toHaveProperty('captionSignedUrls');
      expect(res.body.result).toHaveProperty('videoSignedPaths');
      expect(res.body.result.videoSignedPaths).toHaveProperty('hlsPath');
      expect(res.body.result.videoSignedPaths).toHaveProperty('dashPath');
      expect(res.body.result.videoSignedPaths).toHaveProperty('cloudfrontMigratedHlsPath');
      console.log(res.body.result.videoSignedPaths);
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

      await request(application.getHttpServer()).get(`/videos/${undefined}/sign`).set(requestHeader).send().expect(400);
    });
  });

  describe('/videos/*m3u8 (GET)', () => {
    beforeEach(() => {
      jest.spyOn(storageService, 'getFileFromBucketStorage').mockImplementation((data: GetObjectCommandInput) => {
        const filename = last(data.Key.split('/'));
        const manifest = sdkStreamMixin(Readable.from(readFileSync(`${__dirname}/${filename}`)));
        return Promise.resolve({ Body: manifest, $metadata: null } as GetObjectCommandOutput);
      });

      jest.spyOn(videoService, 'getCaptions').mockImplementation(() => {
        return new Promise((resolve) => resolve([]));
      });
    });

    const attachment = new Attachment();
    attachment.id = v4();
    attachment.appId = 'test';
    attachment.options = {
      cloudfront: {
        path: `https://test-dev.kolable.com/vod-cf/test/${attachment.id.slice(0, 2)}/${
          attachment.id
        }/mockcfuid/manifest/test.m3u8`,
        playPaths: {
          hls: `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/hls/test.m3u8`,
          dash: `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/dash/test.mpd`,
        },
      },
    };

    const programContentBody = new ProgramContentBody();
    programContentBody.id = v4();

    const program = new Program();
    program.title = 'test video program';
    program.appId = 'test';
    program.id = v4();

    const programContentSection = new ProgramContentSection();
    programContentSection.id = v4();
    programContentSection.program = program;
    programContentSection.title = 'test video program content section';
    programContentSection.position = 0;

    const programContent = new ProgramContent();
    programContent.id = v4();
    programContent.displayMode = 'trial';
    programContent.title = 'test video program';
    programContent.position = 0;
    programContent.contentBody = programContentBody;
    programContent.contentSection = programContentSection;

    const programContentVideo = new ProgramContentVideo();
    programContentVideo.id = v4();
    programContentVideo.attachment = attachment;
    programContentVideo.programContent = programContent;

    it('should get m3u8 and remove subtitle tag', async () => {
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

      const res = await request(application.getHttpServer())
        .get(
          `/videos/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/hls/test.m3u8?signature=awsCloudfrontSign`,
        )
        .set(requestHeader)
        .send()
        .expect(200);
      const ans = readFileSync(`${__dirname}/test_ans.m3u8`);
      expect(res.text).toEqual(ans.toString());
    });
  });

  describe.only('/videos/*mpd (GET)', () => {
    beforeEach(() => {
      jest.spyOn(storageService, 'getFileFromBucketStorage').mockImplementation((data: GetObjectCommandInput) => {
        const filename = last(data.Key.split('/'));
        const manifest = sdkStreamMixin(Readable.from(readFileSync(`${__dirname}/${filename}`)));
        return Promise.resolve({ Body: manifest, $metadata: null } as GetObjectCommandOutput);
      });

      jest.spyOn(videoService, 'getCaptions').mockImplementation(() => {
        return new Promise((resolve) => resolve([]));
      });
    });

    const attachment = new Attachment();
    attachment.id = v4();
    attachment.appId = 'test';
    attachment.options = {
      cloudfront: {
        path: `https://test-dev.kolable.com/vod-cf/test/${attachment.id.slice(0, 2)}/${
          attachment.id
        }/mockcfuid/manifest/test.m3u8`,
        playPaths: {
          hls: `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/hls/test.m3u8`,
          dash: `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/dash/test.mpd`,
        },
      },
    };

    const programContentBody = new ProgramContentBody();
    programContentBody.id = v4();

    const program = new Program();
    program.title = 'test video program';
    program.appId = 'test';
    program.id = v4();

    const programContentSection = new ProgramContentSection();
    programContentSection.id = v4();
    programContentSection.program = program;
    programContentSection.title = 'test video program content section';
    programContentSection.position = 0;

    const programContent = new ProgramContent();
    programContent.id = v4();
    programContent.displayMode = 'trial';
    programContent.title = 'test video program';
    programContent.position = 0;
    programContent.contentBody = programContentBody;
    programContent.contentSection = programContentSection;

    const programContentVideo = new ProgramContentVideo();
    programContentVideo.id = v4();
    programContentVideo.attachment = attachment;
    programContentVideo.programContent = programContent;

    it('should get mpd with signed mp4', async () => {
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

      const res = await request(application.getHttpServer())
        .get(
          `/videos/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/dash/test.mpd?signature=awsCloudfrontSign`,
        )
        .set(requestHeader)
        .send()
        .expect(200);
      const ans = readFileSync(`${__dirname}/test_ans.mpd`)
        .toString()
        .replace(
          'https://test-dev.kolable.com/vod/test/attachmentSlice/attachment/output/dash/test_1080.mp4?signature=awsCloudfrontSign',
          `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/dash/test_1080.mp4?signature=awsCloudfrontSign`,
        )
        .replace(
          'https://test-dev.kolable.com/vod/test/attachmentSlice/attachment/output/dash/test_720.mp4?signature=awsCloudfrontSign',
          `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/dash/test_720.mp4?signature=awsCloudfrontSign`,
        )
        .replace(
          'https://test-dev.kolable.com/vod/test/attachmentSlice/attachment/output/dash/test_480.mp4?signature=awsCloudfrontSign',
          `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/dash/test_480.mp4?signature=awsCloudfrontSign`,
        );
      expect(res.text).toEqual(ans);
    });
  });

  describe(':videoId/captions (GET)', () => {
    beforeEach(() => {
      jest
        .spyOn(storageService, 'listFilesInBucketStorage')
        .mockImplementation((data: Omit<ListObjectsV2Request, 'Bucket'>) => {
          const key = data.Prefix;
          return Promise.resolve({
            Contents: [{ Key: `${key}/zh.vtt` }],
            $metadata: null,
          } as ListObjectsV2CommandOutput);
        });
    });

    const attachment = new Attachment();
    attachment.id = v4();
    attachment.appId = 'test';
    attachment.options = {
      cloudfront: {
        path: `https://test-dev.kolable.com/vod-cf/test/${attachment.id.slice(0, 2)}/${
          attachment.id
        }/mockcfuid/manifest/test.m3u8`,
        playPaths: {
          hls: `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/hls/test.m3u8`,
          dash: `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/dash/test.mpd`,
        },
      },
    };

    const programContentBody = new ProgramContentBody();
    programContentBody.id = v4();

    const program = new Program();
    program.title = 'test video program';
    program.appId = 'test';
    program.id = v4();

    const programContentSection = new ProgramContentSection();
    programContentSection.id = v4();
    programContentSection.program = program;
    programContentSection.title = 'test video program content section';
    programContentSection.position = 0;

    const programContent = new ProgramContent();
    programContent.id = v4();
    programContent.displayMode = 'trial';
    programContent.title = 'test video program';
    programContent.position = 0;
    programContent.contentBody = programContentBody;
    programContent.contentSection = programContentSection;

    const programContentVideo = new ProgramContentVideo();
    programContentVideo.id = v4();
    programContentVideo.attachment = attachment;
    programContentVideo.programContent = programContent;

    it('should AuthToken is invalid', async () => {
      const requestHeader = {
        authorization: 'Bearer ' + '',
        host: 'test.something.com',
      };

      await request(application.getHttpServer())
        .get(`/videos/${attachment.id}/captions`)
        .set(requestHeader)
        .send()
        .expect(401);
    });

    it('should get captions', async () => {
      await attachmentRepo.save(attachment);
      await programRepo.save(program);
      await programContentBodyRepo.save(programContentBody);
      await programContentSectionRepo.save(programContentSection);
      await programContentRepo.save(programContent);
      await programContentVideoRepo.save(programContentVideo);
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

      const res = await request(application.getHttpServer())
        .get(`/videos/${attachment.id}/captions`)
        .set(requestHeader)
        .send()
        .expect(200);

      expect(res.body).toEqual({
        code: 'SUCCESS',
        message: 'successfully get s3 captions',
        result: [`https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${attachment.id}/captions/zh.vtt`],
      });
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

      const res = await request(application.getHttpServer())
        .get(`/videos/${undefined}/captions`)
        .set(requestHeader)
        .send()
        .expect(400);
      expect(res.body).toEqual({
        code: 'E_GET_CAPTIONS',
        message: 'invalid input syntax for type uuid: "undefined"',
        result: [],
      });
    });
  });

  describe(':videoId/captions (POST)', () => {
    beforeEach(() => {
      jest.spyOn(storageService, 'saveFileInBucketStorage').mockImplementation(() => {
        return Promise.resolve({} as PutObjectAclCommandOutput);
      });
    });

    const attachment = new Attachment();
    attachment.id = v4();
    attachment.appId = 'test';
    attachment.options = {
      cloudfront: {
        path: `https://test-dev.kolable.com/vod-cf/test/${attachment.id.slice(0, 2)}/${
          attachment.id
        }/mockcfuid/manifest/test.m3u8`,
        playPaths: {
          hls: `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/hls/test.m3u8`,
          dash: `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/dash/test.mpd`,
        },
      },
    };

    const programContentBody = new ProgramContentBody();
    programContentBody.id = v4();

    const program = new Program();
    program.title = 'test video program';
    program.appId = 'test';
    program.id = v4();

    const programContentSection = new ProgramContentSection();
    programContentSection.id = v4();
    programContentSection.program = program;
    programContentSection.title = 'test video program content section';
    programContentSection.position = 0;

    const programContent = new ProgramContent();
    programContent.id = v4();
    programContent.displayMode = 'trial';
    programContent.title = 'test video program';
    programContent.position = 0;
    programContent.contentBody = programContentBody;
    programContent.contentSection = programContentSection;

    const programContentVideo = new ProgramContentVideo();
    programContentVideo.id = v4();
    programContentVideo.attachment = attachment;
    programContentVideo.programContent = programContent;

    it('should AuthToken is invalid', async () => {
      const requestHeader = {
        authorization: 'Bearer ' + '',
        host: 'test.something.com',
      };

      await request(application.getHttpServer())
        .post(`/videos/${attachment.id}/captions`)
        .set(requestHeader)
        .send()
        .expect(401);
    });

    it('should upload captions', async () => {
      await attachmentRepo.save(attachment);
      await programRepo.save(program);
      await programContentBodyRepo.save(programContentBody);
      await programContentSectionRepo.save(programContentSection);
      await programContentRepo.save(programContent);
      await programContentVideoRepo.save(programContentVideo);

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
        'Content-Type': 'multipart/form-data',
      };

      const res = await request(application.getHttpServer())
        .post(`/videos/${attachment.id}/captions`)
        .set(requestHeader)
        .attach('file', `${__dirname}/zh.vtt`)
        .field({
          key: `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${attachment.id}/captions/zh.vtt`,
        })
        .expect(201);

      expect(res.body).toEqual({
        code: 'SUCCESS',
        message: 'successfully update attachment options s3 captions',
        result: `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${attachment.id}/captions/zh.vtt`,
      });
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

      await request(application.getHttpServer())
        .post(`/videos/${undefined}/captions`)
        .set(requestHeader)
        .send()
        .expect(400);
    });
  });

  describe(':videoId/captions (DELETE)', () => {
    beforeEach(() => {
      jest
        .spyOn(storageService, 'listFilesInBucketStorage')
        .mockImplementation((data: Omit<ListObjectsV2Request, 'Bucket'>) => {
          const key = data.Prefix;
          return Promise.resolve({
            Contents: [{ Key: `${key}/zh.vtt` }],
            $metadata: null,
          } as ListObjectsV2CommandOutput);
        });
      jest.spyOn(storageService, 'deleteFileAtBucketStorage').mockImplementation(() => {
        return Promise.resolve({ DeleteMarker: true } as DeleteObjectCommandOutput);
      });
    });

    const attachment = new Attachment();
    attachment.id = v4();
    attachment.appId = 'test';
    attachment.options = {
      cloudfront: {
        path: `https://test-dev.kolable.com/vod-cf/test/${attachment.id.slice(0, 2)}/${
          attachment.id
        }/mockcfuid/manifest/test.m3u8`,
        playPaths: {
          hls: `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/hls/test.m3u8`,
          dash: `https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${
            attachment.id
          }/output/dash/test.mpd`,
        },
      },
    };

    const programContentBody = new ProgramContentBody();
    programContentBody.id = v4();

    const program = new Program();
    program.title = 'test video program';
    program.appId = 'test';
    program.id = v4();

    const programContentSection = new ProgramContentSection();
    programContentSection.id = v4();
    programContentSection.program = program;
    programContentSection.title = 'test video program content section';
    programContentSection.position = 0;

    const programContent = new ProgramContent();
    programContent.id = v4();
    programContent.displayMode = 'trial';
    programContent.title = 'test video program';
    programContent.position = 0;
    programContent.contentBody = programContentBody;
    programContent.contentSection = programContentSection;

    const programContentVideo = new ProgramContentVideo();
    programContentVideo.id = v4();
    programContentVideo.attachment = attachment;
    programContentVideo.programContent = programContent;

    it('should AuthToken is invalid', async () => {
      const requestHeader = {
        authorization: 'Bearer ' + '',
        host: 'test.something.com',
      };

      await request(application.getHttpServer())
        .delete(`/videos/${attachment.id}/captions/zh`)
        .set(requestHeader)
        .send()
        .expect(401);
    });

    it('should delete captions', async () => {
      await attachmentRepo.save(attachment);
      await programRepo.save(program);
      await programContentBodyRepo.save(programContentBody);
      await programContentSectionRepo.save(programContentSection);
      await programContentRepo.save(programContent);
      await programContentVideoRepo.save(programContentVideo);
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

      const res = await request(application.getHttpServer())
        .delete(`/videos/${attachment.id}/captions/zh`)
        .set(requestHeader)
        .send()
        .expect(200);

      expect(res.body).toEqual({
        code: 'SUCCESS',
        message: 'successfully delete s3 captions',
        result: [`https://test-dev.kolable.com/vod/test/${attachment.id.slice(0, 2)}/${attachment.id}/captions/zh.vtt`],
      });
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

      await request(application.getHttpServer())
        .delete(`/videos/${undefined}/captions/zh`)
        .set(requestHeader)
        .expect(400);
    });
  });
});
