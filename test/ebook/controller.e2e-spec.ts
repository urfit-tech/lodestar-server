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
import { StorageService } from '~/utility/storage/storage.service';
import { GetObjectCommandInput, GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { last } from 'lodash';
import { Readable } from 'stream';
import { EbookService } from '~/media/ebook/ebook.service';
import { ProgramContentEbook } from '~/entity/ProgramContentEbook';
import { UtilityService } from '~/utility/utility.service';
import { createTestMember } from '../factory/member.factory';
import { Member } from '~/member/entity/member.entity';
import { EbookRequestDTO } from '~/media/ebook/ebook.dto';
import { validate } from 'class-validator';

const AUTH_TOKEN_ROUTE = '/auth/token';

describe('EbookController (e2e)', () => {
  let application: INestApplication;
  let storageService: StorageService;
  let utilityService: UtilityService;
  let configService: ConfigService;

  let manager: EntityManager;
  let roleRepo: Repository<Role>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appHostRepo: Repository<AppHost>;
  let appSecretRepo: Repository<AppSecret>;
  let appSettingRepo: Repository<AppSetting>;
  let attachmentRepo: Repository<Attachment>;
  let programContentRepo: Repository<ProgramContent>;
  let programContentBodyRepo: Repository<ProgramContentBody>;
  let programContentSectionRepo: Repository<ProgramContentSection>;
  let programRepo: Repository<Program>;
  let programContentEbookRepo: Repository<ProgramContentEbook>;
  let memberRepo: Repository<Member>;

  let ebookService: EbookService;

  function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async function fetchToken() {
    try {
      const tokenResponse = await request(application.getHttpServer())
        .post(AUTH_TOKEN_ROUTE)
        .set('host', appHost.host)
        .send({ clientId: 'test', key: 'testKey', permissions: [] });

      const { authToken } = tokenResponse.body.result;

      const requestHeader = {
        Authorization: `Bearer ${authToken}`,
        host: 'test.something.com',
      };

      return { authToken, requestHeader };
    } catch (error) {
      console.error('Error fetching token:', error);
      throw new Error('Failed to fetch token');
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = module.createNestApplication();
    application.useGlobalPipes(new ValidationPipe()).useGlobalFilters(new ApiExceptionFilter());
    configService = application.get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService);
    storageService = application.get<StorageService>(StorageService);
    utilityService = application.get<UtilityService>(UtilityService);
    ebookService = application.get<EbookService>(EbookService);

    manager = application.get<EntityManager>(getEntityManagerToken());
    roleRepo = manager.getRepository(Role);
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    appHostRepo = manager.getRepository(AppHost);
    appSecretRepo = manager.getRepository(AppSecret);
    appSettingRepo = manager.getRepository(AppSetting);
    attachmentRepo = manager.getRepository(Attachment);
    programContentRepo = manager.getRepository(ProgramContent);
    programContentBodyRepo = manager.getRepository(ProgramContentBody);
    programContentSectionRepo = manager.getRepository(ProgramContentSection);
    programRepo = manager.getRepository(Program);
    programContentEbookRepo = manager.getRepository(ProgramContentEbook);
    memberRepo = manager.getRepository(Member);

    await programContentEbookRepo.delete({});
    await programContentRepo.delete({});
    await programContentBodyRepo.delete({});
    await programContentSectionRepo.delete({});
    await programRepo.delete({});
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
    await programContentEbookRepo.delete({});
    await programContentRepo.delete({});
    await programContentBodyRepo.delete({});
    await programContentSectionRepo.delete({});
    await programRepo.delete({});
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

  describe('/ebook/*epub (GET)', () => {
    beforeEach(() => {
      jest.spyOn(storageService, 'getFileFromBucketStorage').mockImplementation((data: GetObjectCommandInput) => {
        const filename = last(data.Key.split('/'));
        console.log(filename);
        const manifest = sdkStreamMixin(Readable.from(readFileSync(`${__dirname}/${filename}`)));
        return Promise.resolve({ Body: manifest, $metadata: null } as GetObjectCommandOutput);
      });
    });

    const programContentBody = new ProgramContentBody();
    programContentBody.id = v4();

    const program = new Program();
    program.title = 'test ebook program';
    program.appId = 'test';
    program.id = v4();

    const programContentSection = new ProgramContentSection();
    programContentSection.id = v4();
    programContentSection.program = program;
    programContentSection.title = 'test ebook program content section';
    programContentSection.position = 0;

    const programContent = new ProgramContent();
    programContent.id = '5e50b600-5e1b-4094-bd4e-99e506e5ca98';
    programContent.displayMode = 'trial';
    programContent.title = 'test video program';
    programContent.position = 0;
    programContent.contentBody = programContentBody;
    programContent.contentSection = programContentSection;

    const programContentEbook = new ProgramContentEbook();
    programContentEbook.id = v4();
    programContentEbook.programContentId = programContent.id;
    programContentEbook.data = {
      name: '7B_2048 試閱本版本號3.0.epub',
      size: 1963602,
      type: 'application/epub+zip',
      lastModified: 1702894577490,
    };

    describe('Success Test', () => {
      it('should retrieve an encrypted EPUB file and verify its length', async () => {
        const { requestHeader } = await fetchToken();

        const insertedMember = await createTestMember(manager, {
          appId: app.id,
          role: 'app-owner',
        });

        const jwtSecret = application
          .get<ConfigService<{ HASURA_JWT_SECRET: string }>>(ConfigService)
          .getOrThrow('HASURA_JWT_SECRET');

        const token = sign({ memberId: insertedMember.id }, jwtSecret);

        const hashKey = token.split('.')[2];
        const hashIv = 'test';

        const originalEpubPath = `${__dirname}/5e50b600-5e1b-4094-bd4e-99e506e5ca98.epub`;
        const originalEpub = readFileSync(originalEpubPath);
        const epubStream = Readable.from(originalEpub);
        const encryptEpubFile = utilityService.encryptDataStream(epubStream, hashKey, hashIv);
        const encryptedBuffer = (await streamToBuffer(encryptEpubFile)) as Buffer;

        const res = await request(application.getHttpServer())
          .get(`/ebook/${programContent.id}.epub`)
          .set(requestHeader)
          .responseType('arraybuffer')
          .send()
          .expect(200);

        expect(res.body.length).toEqual(encryptedBuffer.length);
      });
    });

    describe('EbookController Authorization Tests', () => {
      it('should return an error for unauthorized access', async () => {
        const requestHeader = {
          host: 'test.something.com',
        };

        const response = await request(application.getHttpServer())
          .get(`/ebook/some-program-content-id`)
          .set(requestHeader)
          .expect(401);

        expect(response.body.message).toBe('Unauthorized');
        expect(response.body.statusCode).toBe(401);
      });

      it('should return an error for invalid token', async () => {
        const invalid = 'invalid';
        const invalidToken = `Bearer ${invalid}`;
        const requestHeader = {
          Authorization: invalidToken,
          host: 'test.something.com',
        };

        const response = await request(application.getHttpServer())
          .get(`/ebook/some-program-content-id`)
          .set(requestHeader)
          .expect(401);

        expect(response.body.message).toBe('Unauthorized');
        expect(response.body.statusCode).toBe(401);
      });
    });

    describe('EbookController Input Validation Tests', () => {
      it('should return an error for invalid programContentId', async () => {
        const { requestHeader } = await fetchToken();

        const invalidProgramContentId = 'invalid-id';

        const response = await request(application.getHttpServer())
          .get(`/ebook/${invalidProgramContentId}`)
          .set(requestHeader)
          .expect(400);

        expect(response.body.code).toBe('EbookFileRetrievalError');
        expect(response.body.message).toBe('Unable to retrieve ebook file');
      });
    });

    describe('EbookController File Handling and Encryption Tests', () => {
      it('should handle encryption errors', async () => {
        const { requestHeader } = await fetchToken();

        jest.spyOn(ebookService, 'encryptEbook').mockImplementation(() => {
          throw new Error('Encryption error');
        });

        const response = await request(application.getHttpServer())
          .get(`/ebook/${programContent.id}.epub`)
          .set(requestHeader)
          .send()
          .expect(400);

        expect(response.body.code).toBe('EbookFileEncryptionError');
        expect(response.body.message).toBe('Error encrypting ebook file');
      });
    });

    describe('EbookController Handing Error Params', () => {
      it('should handle empty appId', async () => {
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

        jest.spyOn(ebookService, 'encryptEbook').mockImplementation(() => {
          throw new Error('Encryption error');
        });

        const response = await request(application.getHttpServer())
          .get(`/ebook/${programContent.id}.epub`)
          .set(requestHeader)
          .send()
          .expect(400);

        expect(response.body.code).toBe('EbookByProgramContentId_Error');
        expect(response.body.message).toBe('Invalid request parameters');
      });
    });

    describe('EbookRequestDTO', () => {
      describe('Validation', () => {
        it('should validate with a valid string', async () => {
          const dto = new EbookRequestDTO();
          dto.programContentId = 'valid_string';

          const errors = await validate(dto);
          expect(errors.length).toBe(0);
        });

        it('should not validate with a non-string value', async () => {
          const dto = new EbookRequestDTO();
          dto.programContentId = 123 as any;

          const errors = await validate(dto);
          expect(errors.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
