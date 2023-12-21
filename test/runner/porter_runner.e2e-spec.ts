import { Test, TestingModule } from '@nestjs/testing';
import { PorterRunner } from '../../src/runner/porter.runner';
import { CacheService } from '~/utility/cache/cache.service';
import axios from 'axios';
import { RunnerModule } from '~/runner/runner.module';
import { INestApplication } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { Member } from '~/member/entity/member.entity';
import { Runner } from '~/runner/runner';
import { Role } from '~/entity/Role';
import { App } from '~/app/entity/app.entity';
import {
  app,
  appHost,
  appPlan,
  appSecret,
  appSetting,
  currency,
  member,
  podcastAlbum,
  podcastProgram,
  program,
  programContent,
  programContentBody,
  programContentProgress,
  programContentSection,
  programPlan,
  role,
} from '../data';
import { AppPlan } from '~/entity/AppPlan';
import { AppHost } from '~/app/entity/app_host.entity';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { AppSetting } from '~/app/entity/app_setting.entity';
import { ProgramContentSection } from '~/entity/ProgramContentSection';
import { Program } from '~/entity/Program';
import { ProgramContentBody } from '~/entity/ProgramContentBody';
import { ProgramContentProgress } from '~/entity/ProgramContentProgress';
import { ProgramPlan } from '~/entity/ProgramPlan';
import { ProgramContent } from '~/program/entity/program_content.entity';
import { Currency } from '~/entity/Currency';
import { ProgramContentLog } from '~/program/entity/ProgramContentLog';
import { PodcastProgramProgress } from '~/podcast/entity/PodcastProgramProgress';
import { PodcastProgram } from '~/podcast/entity/PodcastProgram';
import { PodcastAlbum } from '~/podcast/entity/PodcastAlbum';
import { v4 } from 'uuid';

jest.mock('axios', () => ({
  get: jest.fn(),
}));

describe('PorterRunner (e2e)', () => {
  let application: INestApplication;
  let cacheService: CacheService;
  let manager: EntityManager;
  let roleRepo: Repository<Role>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appHostRepo: Repository<AppHost>;
  let appSecretRepo: Repository<AppSecret>;
  let appSettingRepo: Repository<AppSetting>;
  let memberRepo: Repository<Member>;
  let programPlanRepo: Repository<ProgramPlan>;
  let programContentSectionRepo: Repository<ProgramContentSection>;
  let programContentBodyRepo: Repository<ProgramContentBody>;
  let programContentRepo: Repository<ProgramContent>;
  let programContentProgressRepo: Repository<ProgramContentProgress>;
  let programRepo: Repository<Program>;
  let currencyRepo: Repository<Currency>;
  let programContentLogRepo: Repository<ProgramContentLog>;
  let podcastProgramProgressRepo: Repository<PodcastProgramProgress>;
  let podcastProgramRepo: Repository<PodcastProgram>;
  let podcastAlbumRepo: Repository<PodcastAlbum>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RunnerModule.forRoot({
          workerName: PorterRunner.name,
          nodeEnv: 'test',
          clazz: PorterRunner,
          noGo: true,
        }),
      ],
      providers: [],
    }).compile();

    application = moduleFixture.createNestApplication();

    cacheService = application.get<CacheService>(CacheService);
    manager = application.get<EntityManager>(getEntityManagerToken());

    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    appSettingRepo = manager.getRepository(AppSetting);
    appSecretRepo = manager.getRepository(AppSecret);
    appHostRepo = manager.getRepository(AppHost);
    roleRepo = manager.getRepository(Role);
    memberRepo = manager.getRepository(Member);
    programRepo = manager.getRepository(Program);
    programPlanRepo = manager.getRepository(ProgramPlan);
    programContentSectionRepo = manager.getRepository(ProgramContentSection);
    programContentBodyRepo = manager.getRepository(ProgramContentBody);
    programContentRepo = manager.getRepository(ProgramContent);
    programContentProgressRepo = manager.getRepository(ProgramContentProgress);
    currencyRepo = manager.getRepository(Currency);
    programContentLogRepo = manager.getRepository(ProgramContentLog);
    podcastProgramRepo = manager.getRepository(PodcastProgram);
    podcastProgramProgressRepo = manager.getRepository(PodcastProgramProgress);
    podcastAlbumRepo = manager.getRepository(PodcastAlbum);

    await cacheService.getClient().flushdb();

    await podcastProgramProgressRepo.delete({});
    await podcastProgramRepo.delete({});
    await programContentProgressRepo.delete({});
    await programContentLogRepo.delete({});
    await programContentRepo.delete({});
    await programContentSectionRepo.delete({});
    await programContentBodyRepo.delete({});
    await programPlanRepo.delete({});
    await programRepo.delete({});
    await podcastAlbumRepo.delete({});
    await currencyRepo.delete({});
    await memberRepo.delete({});
    await appHostRepo.delete({});
    await appSecretRepo.delete({});
    await appSettingRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await roleRepo.save(role);
    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await appSettingRepo.save(appSetting);
    await appSecretRepo.save(appSecret);
    await appHostRepo.save(appHost);
    await memberRepo.save(member);
    await currencyRepo.save(currency);
    await podcastAlbumRepo.save(podcastAlbum);
    await programRepo.save(program);
    await programPlanRepo.save(programPlan);
    await programContentBodyRepo.save(programContentBody);
    await programContentSectionRepo.save(programContentSection);
    await programContentRepo.save(programContent);
    await programContentProgressRepo.save(programContentProgress);
    await podcastProgramRepo.save(podcastProgram);

    await cacheService
      .getClient()
      .set(
        `program-content-event:${member.id}:program-content:${programContent.id}:${Date.now()}`,
        JSON.stringify({ playbackRate: 1.25, startedAt: 496.957357, endedAt: 502.26019 }),
        'EX',
        7 * 86400,
      );

    await cacheService.getClient().set(
      `podcast-program-event:${member.id}:podcast-program:${podcastProgram.id}:${Date.now()}`,
      JSON.stringify({
        progress: '190.2503679064795',
        lastProgress: 190.2503679064795,
        podcastAlbumId: `${podcastAlbum.id}`,
      }),
      'EX',
      7 * 86400,
    );
    jest.resetAllMocks();
    await application.init();
  });

  afterEach(async () => {
    await cacheService.getClient().flushall();
    await podcastProgramProgressRepo.delete({});
    await podcastProgramRepo.delete({});
    await programContentProgressRepo.delete({});
    await programContentLogRepo.delete({});
    await programContentRepo.delete({});
    await programContentSectionRepo.delete({});
    await programContentBodyRepo.delete({});
    await programPlanRepo.delete({});
    await programRepo.delete({});
    await podcastAlbumRepo.delete({});
    await currencyRepo.delete({});
    await memberRepo.delete({});
    await appHostRepo.delete({});
    await appSecretRepo.delete({});
    await appSettingRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});

    await application.close();
  });

  describe('testing heartbeat', () => {
    it('should call the heartbeat URL if PORTER_HEARTBEAT_URL is set', async () => {
      const mockedAxiosGet = axios.get as jest.Mock;
      const testUrl = 'http://test-heartbeat-url.com';
      process.env.PORTER_HEARTBEAT_URL = testUrl;

      const porterRunner = application.get<PorterRunner>(Runner);
      await porterRunner.execute(manager);

      expect(mockedAxiosGet).toHaveBeenCalledWith(testUrl);
    });

    it('should not call the heartbeat URL if PORTER_HEARTBEAT_URL is not set', async () => {
      const mockedAxiosGet = axios.get as jest.Mock;
      delete process.env.PORTER_HEARTBEAT_URL;

      const porterRunner = application.get<PorterRunner>(Runner);
      await porterRunner.execute(manager);

      expect(mockedAxiosGet).not.toHaveBeenCalled();
    });

    it('should not call the heartbeat URL if PORTER_HEARTBEAT_URL is not a valid URL', async () => {
      const mockedAxiosGet = axios.get as jest.Mock;
      const invalidUrl = 'not-a-valid-url';
      process.env.PORTER_HEARTBEAT_URL = invalidUrl;

      const porterRunner = application.get<PorterRunner>(Runner);
      await porterRunner.execute(manager);

      expect(mockedAxiosGet).not.toHaveBeenCalled();
    });
  });

  describe('last-logged-in', () => {
    describe('Success scenarios', () => {
      it('should update member after executing porterRunner', async () => {
        await cacheService.getClient().set(`last-logged-in:${member.id}`, new Date().toISOString(), 'EX', 7 * 86400);

        await memberRepo.update({ id: member.id }, { loginedAt: null });

        let updatedMember = await memberRepo.findOne({ where: { id: member.id } });
        expect(updatedMember.loginedAt).toBeNull();

        const porterRunner = application.get<PorterRunner>(Runner);
        await porterRunner.execute(manager);

        updatedMember = await memberRepo.findOne({ where: { id: member.id } });

        expect(updatedMember.loginedAt).not.toBeNull();
      });

      it('should update member after executing porterRunner, with large data in redis', async () => {
        const members = [];

        for (let i = 0; i < 50; i++) {
          const insertedMemberId = v4();
          const insertedMember = new Member();
          insertedMember.appId = app.id;
          insertedMember.id = insertedMemberId;
          insertedMember.name = `name-${i}`;
          insertedMember.username = `username-${i}`;
          insertedMember.email = `${i}email@example.com`;
          insertedMember.role = 'general-member';
          insertedMember.star = 0;
          insertedMember.createdAt = new Date();
          insertedMember.loginedAt = null;
          await manager.save(insertedMember);

          await cacheService
            .getClient()
            .set(`last-logged-in:${insertedMemberId}`, new Date().toISOString(), 'EX', 7 * 86400);

          members.push(insertedMemberId);
        }

        const porterRunner = application.get<PorterRunner>(Runner);
        await porterRunner.portLastLoggedIn(manager, 20);

        for (const memberId of members) {
          const updatedMember = await memberRepo.findOne({ where: { id: memberId } });
          expect(updatedMember.loginedAt).not.toBeNull();
        }
      });

      it('should update member loginedAt to the last login time among multiple records', async () => {
        const memberId = v4();
        const member = new Member();
        member.appId = app.id;
        member.id = memberId;
        member.name = `name`;
        member.username = `username`;
        member.email = `email@example.com`;
        member.role = 'general-member';
        member.star = 0;
        member.createdAt = new Date();
        member.loginedAt = null;
        await manager.save(member);

        const now = new Date();
        for (let i = 0; i < 3; i++) {
          const loginTime = new Date(now.getTime() + i * 1000);
          await cacheService.getClient().set(`last-logged-in:${memberId}`, loginTime.toISOString(), 'EX', 7 * 86400);
        }

        const porterRunner = application.get<PorterRunner>(Runner);
        await porterRunner.portLastLoggedIn(manager, 20);

        const updatedMember = await memberRepo.findOne({ where: { id: memberId } });
        expect(updatedMember.loginedAt).toEqual(new Date(now.getTime() + 2 * 1000));
      });
      it('should clear Redis keys after updating member login date', async () => {
        const key = `last-logged-in:${member.id}`;
        await cacheService.getClient().set(key, new Date().toISOString(), 'EX', 7 * 86400);

        let keyExists = await cacheService.getClient().exists(key);
        expect(keyExists).toBe(1);

        const porterRunner = application.get<PorterRunner>(Runner);
        await porterRunner.portLastLoggedIn(manager, 20);

        keyExists = await cacheService.getClient().exists(key);
        expect(keyExists).toBe(0);
      });
    });

    describe('Failure scenarios', () => {
      it('should clear Redis key even if the member does not exist and should have console error', async () => {
        const nonExistentMemberId = v4();

        const key = `last-logged-in:${nonExistentMemberId}`;
        await cacheService.getClient().set(key, new Date().toISOString(), 'EX', 7 * 86400);

        let keyExists = await cacheService.getClient().exists(key);
        expect(keyExists).toBe(1);

        const consoleSpy = jest.spyOn(console, 'error');

        const porterRunner = application.get<PorterRunner>(Runner);
        await porterRunner.portLastLoggedIn(manager, 20);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(`No records updated for memberId: ${nonExistentMemberId}. Member might not exist.`),
        );

        consoleSpy.mockRestore();

        keyExists = await cacheService.getClient().exists(key);
        expect(keyExists).toBe(0);
      });
      it('should not update last login time if it cannot be converted to a date', async () => {
        const invalidDate = 'not-a-date';
        const key = `last-logged-in:${member.id}`;

        await memberRepo.update({ id: member.id }, { loginedAt: null });

        await cacheService.getClient().set(key, invalidDate, 'EX', 7 * 86400);

        const consoleSpy = jest.spyOn(console, 'error');

        const porterRunner = application.get<PorterRunner>(Runner);
        await porterRunner.portLastLoggedIn(manager, 20);

        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();

        const updatedMember = await memberRepo.findOne({ where: { id: member.id } });

        expect(updatedMember.loginedAt).toBeNull();

        const keyExists = await cacheService.getClient().exists(key);
        expect(keyExists).toBe(0);
      });
    });
  });

  describe('portPlayerEvent', () => {
    it('should correctly save program content log', async () => {
      const porterRunner = application.get<PorterRunner>(Runner);

      await porterRunner.portPlayerEvent(manager, 30);

      const [latestLog] = await programContentLogRepo.find({
        order: { createdAt: 'DESC' },
        take: 1,
      });

      expect(latestLog.playbackRate).toEqual('1.25');
      expect(latestLog.startedAt).toEqual('496.957357');
      expect(latestLog.endedAt).toEqual('502.26019');
      expect(latestLog.memberId).toEqual(member.id);
    });

    describe('portPlayerEvent with batchSize 20', () => {
      it('Assess the handling and accurate processing of 80 program content log records in batches', async () => {
        await programContentLogRepo.delete({});
        await cacheService.getClient().flushall();

        for (let i = 0; i < 80; i++) {
          await cacheService
            .getClient()
            .set(
              `program-content-event:${member.id}:program-content:${programContent.id}:${Date.now() + i}`,
              JSON.stringify({ playbackRate: 1.25, startedAt: 500 + i, endedAt: 600 + i }),
              'EX',
              7 * 86400,
            );
        }

        const porterRunner = application.get<PorterRunner>(Runner);
        await porterRunner.portPlayerEvent(manager, 20);

        const logs = await programContentLogRepo.find({ order: { createdAt: 'ASC' } });
        expect(logs.length).toEqual(80);
        logs.forEach((log, index) => {
          expect(log.playbackRate).toEqual('1.25');
          expect(log.startedAt).toEqual(`${500 + index}`);
          expect(log.endedAt).toEqual(`${600 + index}`);
          expect(log.memberId).toEqual(member.id);
        });
      });
      it('should process and save 79 out of 80 records and delete all Redis keys , when memberId did not exist', async () => {
        await programContentLogRepo.delete({});
        await cacheService.getClient().flushall();

        const nonExistentMemberId = 'non-existent-member-id';
        for (let i = 0; i < 80; i++) {
          const memberId = i === 50 ? nonExistentMemberId : member.id;
          await cacheService
            .getClient()
            .set(
              `program-content-event:${memberId}:program-content:${programContent.id}:${Date.now() + i}`,
              JSON.stringify({ playbackRate: 1.25, startedAt: 500 + i, endedAt: 600 + i }),
              'EX',
              7 * 86400,
            );
        }
        const consoleSpy = jest.spyOn(console, 'error');
        const porterRunner = application.get<PorterRunner>(Runner);
        await porterRunner.portPlayerEvent(manager, 20);

        const logs = await programContentLogRepo.find({ order: { createdAt: 'ASC' } });
        expect(logs.length).toEqual(79);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'Saving log failed: QueryFailedError: insert or update on table "program_content_log" violates foreign key constraint "program_content_log_member_id_fkey"',
          ),
        );

        logs.forEach((log, index) => {
          expect(log.playbackRate).toEqual('1.25');
          expect(log.startedAt).not.toEqual(`${500 + 50}`);
          expect(log.endedAt).not.toEqual(`${600 + 50}`);
          expect(log.memberId).not.toEqual(nonExistentMemberId);
        });

        const remainingKeys = await cacheService.getClient().keys('program-content-event:*');
        console.log(remainingKeys);
        expect(remainingKeys.length).toEqual(0);
        consoleSpy.mockRestore();
      });
      it('should process and save 79 out of 80 records and delete all Redis keys, when startAt format error', async () => {
        await programContentLogRepo.delete({});
        await cacheService.getClient().flushall();

        for (let i = 0; i < 80; i++) {
          const programContentId = i === 50 ? 'nonExistProgramContentId' : programContent.id; // Introduce error in one record
          await cacheService
            .getClient()
            .set(
              `program-content-event:${member.id}:program-content:${programContentId}:${Date.now() + i}`,
              JSON.stringify({ playbackRate: 1.25, startedAt: 500 + i, endedAt: 600 + i }),
              'EX',
              7 * 86400,
            );
        }

        const porterRunner = application.get<PorterRunner>(Runner);
        await porterRunner.portPlayerEvent(manager, 20);

        const logs = await programContentLogRepo.find({ order: { createdAt: 'ASC' } });
        expect(logs.length).toEqual(79);

        logs.forEach((log, index) => {
          expect(log.playbackRate).toEqual('1.25');
          expect(log.startedAt).not.toEqual(`${500 + 50}`);
          expect(log.endedAt).not.toEqual(`${600 + 50}`);
          expect(log.programContentId).not.toEqual('nonExistProgramContentId');
        });

        const remainingKeys = await cacheService.getClient().keys('program-content-event:*');
        expect(remainingKeys.length).toEqual(0);
      });
    });

    describe('portPlayerEvent with no Redis data', () => {
      it('Ensure proper handling and no errors when no Redis data is available for processing player events', async () => {
        await programContentLogRepo.delete({});
        await cacheService.getClient().flushall();

        const porterRunner = application.get<PorterRunner>(Runner);

        await expect(porterRunner.portPlayerEvent(manager)).resolves.not.toThrow();

        const logs = await programContentLogRepo.find();
        expect(logs.length).toEqual(0);
      });
    });
  });

  describe('portPodcastProgram', () => {
    describe('Success scenarios', () => {
      it('Check if podcast program progress is correctly saved and processed.', async () => {
        const porterRunner = application.get<PorterRunner>(Runner);

        await porterRunner.execute(manager);

        const [latesProgress] = await podcastProgramProgressRepo.find({
          order: { createdAt: 'DESC' },
          take: 1,
        });

        expect(latesProgress.memberId).toEqual(member.id);
        expect(latesProgress.podcastProgramId).toEqual(podcastProgram.id);
        expect(latesProgress.progress).toEqual('190.2503679064795');
        expect(latesProgress.podcastAlbumId).toEqual(podcastAlbum.id);
        const scanResult = await cacheService.getClient().keys('podcast-program-event:*:podcast-program:*:*');
        const remainingKeysCount = scanResult.length;
        expect(remainingKeysCount).toEqual(0);
      });

      it('Verify deduplication, ensuring only one record is saved in the database for duplicate entries , and should save the last create record', async () => {
        await podcastProgramProgressRepo.delete({});
        await cacheService.getClient().flushall();

        for (let i = 0; i < 4; i++) {
          await cacheService
            .getClient()
            .set(
              `podcast-program-event:${member.id}:podcast-program:${podcastProgram.id}:${Date.now()}`,
              JSON.stringify({ progress: `${10.0 + i}`, lastProgress: `${5 + i}`, podcastAlbumId: podcastAlbum.id }),
              'EX',
              7 * 86400,
            );
        }

        const porterRunner = application.get<PorterRunner>(Runner);
        await porterRunner.portPodcastProgram(manager);

        const progressRecords = await podcastProgramProgressRepo.find();
        expect(progressRecords.length).toEqual(1);

        const record = progressRecords.find((record) => record.memberId === member.id);
        expect(record.progress).toEqual('13');

        const scanResult = await cacheService.getClient().keys('podcast-program-event:*:podcast-program:*:*');
        const remainingKeysCount = scanResult.length;
        expect(remainingKeysCount).toEqual(0);
      });

      it('when batch size is 20, 80 records in Redis, 2 member podcast programs, 1 member has an error', async () => {
        await podcastProgramProgressRepo.delete({});
        await cacheService.getClient().flushall();
        const nonExistentMemberId = 'nonExistMemberId';

        const insertedMemberId = v4();
        const insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = insertedMemberId;
        insertedMember.name = `name`;
        insertedMember.username = `username`;
        insertedMember.email = `email@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();
        await manager.save(insertedMember);

        for (let i = 0; i < 80; i++) {
          const currentMemberId = i === 79 ? nonExistentMemberId : member.id;
          await cacheService
            .getClient()
            .set(
              `podcast-program-event:${currentMemberId}:podcast-program:${podcastProgram.id}:${Date.now()}`,
              JSON.stringify({ progress: `${10.0 + i}`, lastProgress: `${5 + i}`, podcastAlbumId: podcastAlbum.id }),
              'EX',
              7 * 86400,
            );

          if (i % 10 === 0) {
            await cacheService
              .getClient()
              .set(
                `podcast-program-event:${insertedMemberId}:podcast-program:${podcastProgram.id}:${Date.now()}`,
                JSON.stringify({ progress: `${10.0 + i}`, lastProgress: `${5 + i}`, podcastAlbumId: podcastAlbum.id }),
                'EX',
                7 * 86400,
              );
          }
        }
        const consoleSpy = jest.spyOn(console, 'error');
        const porterRunner = application.get<PorterRunner>(Runner);
        await porterRunner.portPodcastProgram(manager);

        const progressRecords = await podcastProgramProgressRepo.find();
        expect(progressRecords.length).toEqual(2);

        const record = progressRecords.find((record) => record.memberId === member.id);
        const insertedMemberRecord = progressRecords.find((record) => record.memberId === insertedMemberId);
        expect(record.progress).toEqual(`${10 + 78}`);
        expect(record.lastProgress).not.toEqual(`${5 + 79}`);
        expect(insertedMemberRecord.lastProgress).toEqual(`${5 + 70}`);
        expect(consoleSpy).toHaveBeenCalled();

        const scanResult = await cacheService.getClient().keys('podcast-program-event:*:podcast-program:*:*');
        const remainingKeysCount = scanResult.length;
        expect(remainingKeysCount).toEqual(0);
        consoleSpy.mockRestore();
      });
    });

    describe('Failure scenarios', () => {
      it('when redis is empty , should not save any data and not throw errors', async () => {
        await podcastProgramProgressRepo.delete({});
        await cacheService.getClient().flushall();

        const porterRunner = application.get<PorterRunner>(Runner);

        await expect(porterRunner.portPodcastProgram(manager)).resolves.not.toThrow();

        const progressRecords = await podcastProgramProgressRepo.find();
        expect(progressRecords.length).toEqual(0);

        const scanResult = await cacheService.getClient().keys('podcast-program-event:*');
        const remainingKeysCount = scanResult.length;
        expect(remainingKeysCount).toEqual(0);
      });

      it('Evaluate error handling when processing podcast progress records with a non-existent member ID', async () => {
        await podcastProgramProgressRepo.delete({});
        await cacheService.getClient().flushall();

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

        const nonExistentMemberId = 'non-existent-member-id';

        await cacheService
          .getClient()
          .set(
            `podcast-program-event:${member.id}:podcast-program:${podcastProgram.id}:${Date.now()}`,
            JSON.stringify({ progress: '10.0', lastProgress: '5.0', podcastAlbumId: podcastAlbum.id }),
            'EX',
            7 * 86400,
          );

        await cacheService
          .getClient()
          .set(
            `podcast-program-event:${insertedMember.id}:podcast-program:${podcastProgram.id}:${Date.now()}`,
            JSON.stringify({ progress: '10.0', lastProgress: '5.0', podcastAlbumId: podcastAlbum.id }),
            'EX',
            7 * 86400,
          );

        await cacheService
          .getClient()
          .set(
            `podcast-program-event:${nonExistentMemberId}:podcast-program:${podcastProgram.id}:${Date.now()}`,
            JSON.stringify({ progress: '10.0', lastProgress: '5.0', podcastAlbumId: podcastAlbum.id }),
            'EX',
            7 * 86400,
          );

        const consoleSpy = jest.spyOn(console, 'error');
        const porterRunner = application.get<PorterRunner>(Runner);
        await porterRunner.portPodcastProgram(manager);

        const progressRecords = await podcastProgramProgressRepo.find();
        expect(progressRecords.length).toEqual(2);

        const nonExistentRecord = progressRecords.find((record) => record.memberId === nonExistentMemberId);
        expect(nonExistentRecord).toBeUndefined();
        expect(consoleSpy).toHaveBeenCalled();

        const scanResult = await cacheService.getClient().keys('podcast-program-event:*:podcast-program:*:*');
        const remainingKeysCount = scanResult.length;
        expect(remainingKeysCount).toEqual(0);
        consoleSpy.mockRestore();
      });
    });
  });
});
