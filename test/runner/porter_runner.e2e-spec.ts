import { Test, TestingModule } from '@nestjs/testing';
import { PorterRunner } from '../../src/runner/porter.runner';
import { CacheService } from '~/utility/cache/cache.service';
import axios from 'axios'
import { RunnerModule } from '~/runner/runner.module';
import { INestApplication } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { Member } from '~/member/entity/member.entity';
import { Runner } from '~/runner/runner';
import { Role } from '~/entity/Role';
import { App } from '~/app/entity/app.entity';
import { app, appHost, appPlan, appSecret, appSetting, currency, member, podcastProgram, program, programContent, programContentBody, programContentProgress, programContentSection, programPlan, role } from '../data';
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
import { ProgramContentLog } from '~/entity/ProgramContentLog';
import { PodcastProgramProgress } from '~/entity/PodcastProgramProgress';
import { PodcastProgram } from '~/entity/PodcastProgram';

jest.mock('axios', () => ({
  get: jest.fn()
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
  let podcastProgramProgressRepo: Repository<PodcastProgramProgress>
  let podcastProgramRepo: Repository<PodcastProgram>



  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RunnerModule.forRoot({
          workerName: PorterRunner.name,
          nodeEnv: 'test',
          clazz: PorterRunner,
          noGo: true,
        }),
      ],
      providers: [
      ],
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
    podcastProgramRepo = manager.getRepository(PodcastProgram)
    podcastProgramProgressRepo = manager.getRepository(PodcastProgramProgress)

    await cacheService.getClient().flushdb();

    await programPlanRepo.delete({});
    await currencyRepo.delete({});
    await programContentLogRepo.delete({})
    await programContentProgressRepo.delete({});
    await programContentRepo.delete({});
    await programContentSectionRepo.delete({});
    await programContentBodyRepo.delete({});
    await programRepo.delete({});
    await podcastProgramProgressRepo.delete({})
    await podcastProgramRepo.delete({})
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
    await appSettingRepo.save(appSetting);
    await appSecretRepo.save(appSecret);
    await appHostRepo.save(appHost);
    await memberRepo.save(member);
    await currencyRepo.save(currency);
    await programRepo.save(program);
    await programPlanRepo.save(programPlan);
    await programContentBodyRepo.save(programContentBody);
    await programContentSectionRepo.save(programContentSection);
    await programContentRepo.save(programContent);
    await programContentProgressRepo.save(programContentProgress);
    await podcastProgramRepo.save(podcastProgram)

    await cacheService.getClient().set(
      `last-logged-in:${member.id}`, 
      '2023-01-02T00:00:00Z', 
      'EX', 
      7 * 86400
    );

    await cacheService.getClient().set(
      `program-content-event:${member.id}:program-content:${programContent.id}:${Date.now()}`,
      JSON.stringify({"playbackRate":1.25,"startedAt":496.957357,
      "endedAt":502.26019
      }),
      'EX',
      7 * 86400,
    )

    await cacheService.getClient().set(
      `podcast-program-event:${member.id}:podcast-program:${podcastProgram.id}:${Date.now()}`,
      JSON.stringify({
        progress: "190.2503679064795",
        lastProgress: 190.2503679064795,
        podcastAlbumId: "73cf33ca-4bae-4c28-8e8a-87122c2096cb",
      }),
      'EX',
      7 * 86400,
    )

    await application.init();

  });

  afterAll(async () => {
    await application.close();
  });
  
  describe("testing heartbeat",  () => {
    it('should call the heartbeat URL if PORTER_HEARTBEAT_URL is set', async () => {
      const mockedAxiosGet = axios.get as jest.Mock;
      const testUrl = 'http://test-heartbeat-url.com';
      process.env.PORTER_HEARTBEAT_URL = testUrl;
  
      const porterRunner = application.get<PorterRunner>(Runner);
      await porterRunner.execute();
  
      expect(mockedAxiosGet).toHaveBeenCalledWith(testUrl);
    });
  })

  describe("last-logged-in", () => {

    it('should update member after get the value from redis', async () => {
      const porterRunner = application.get<PorterRunner>(Runner);
      
      await porterRunner.execute();
      const updatedMember = await memberRepo.findOneById(member.id);

      console.log('updatedMember', updatedMember)
      
      const updatedDateUTC = updatedMember.loginedAt.toUTCString();
      const expectedDateUTC = new Date('2023-01-02T00:00:00Z');
      expectedDateUTC.setHours(expectedDateUTC.getHours() - 8);
      const expectedDateString = expectedDateUTC.toUTCString();  
    
      expect(updatedDateUTC).toEqual(expectedDateString);
    });
  })

  describe("portPlayerEvent", () => {

    it('should correctly save program content log', async () => {

      const porterRunner = application.get<PorterRunner>(Runner);
        
      await porterRunner.execute();

      const [latestLog] = await programContentLogRepo.find({
        order: { createdAt: 'DESC' },
        take: 1
      });

      expect(latestLog.playbackRate).toEqual('1.25')
      expect(latestLog.startedAt).toEqual('496.957357')
      expect(latestLog.endedAt).toEqual('502.26019')
      expect(latestLog.memberId).toEqual(member.id)
    });
  
  });


  describe("portPodcastProgram", () => {

    it('should correctly save podcast program progress', async () => {

      const porterRunner = application.get<PorterRunner>(Runner);
        
      await porterRunner.execute();

      const [latesProgress] = await podcastProgramProgressRepo.find({
        order: { createdAt: 'DESC' },
        take: 1
      });

      expect(latesProgress.memberId).toEqual(member.id)
      expect(latesProgress.podcastProgramId).toEqual(podcastProgram.id)
    });
  
  });
  
});
