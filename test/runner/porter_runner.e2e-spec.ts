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
import { v4 } from 'uuid';
import { Role } from '~/entity/Role';
import { App } from '~/app/entity/app.entity';
import { app, appHost, appPlan, appSecret, appSetting, member, memberTag, role } from '../data';
import { AppPlan } from '~/entity/AppPlan';
import { AppHost } from '~/app/entity/app_host.entity';
import { AppSecret } from '~/app/entity/app_secret.entity';
import { AppSetting } from '~/app/entity/app_setting.entity';

jest.mock('axios', () => ({
  get: jest.fn()
}));

describe('PorterRunner', () => {
  let application: INestApplication;
  let cacheService: any;
  let manager: EntityManager;
  let roleRepo: Repository<Role>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let appHostRepo: Repository<AppHost>;
  let appSecretRepo: Repository<AppSecret>;
  let appSettingRepo: Repository<AppSetting>;
  let memberRepo: Repository<Member>;

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

    await memberRepo.delete({});
    await appSettingRepo.delete({});
    await appSecretRepo.delete({});
    await appHostRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await roleRepo.delete({});


    await application.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
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
    describe('success process', () => {
      let mockLastLoggedInKeys;
      let mockMemberLastLoggedInTimestamps;

      beforeAll(async ()=> {
        await roleRepo.save(role);
        await appPlanRepo.save(appPlan);
        await appRepo.save(app);
        await appSettingRepo.save(appSetting);
        await appSecretRepo.save(appSecret);
        await appHostRepo.save(appHost);
        await memberRepo.save(member);

        mockLastLoggedInKeys = [`last-logged-in:${member.id}`];
        mockMemberLastLoggedInTimestamps = ['2023-01-02T00:00:00Z'];

        jest.spyOn(cacheService, 'getClient').mockReturnValue({
          get: jest.fn().mockResolvedValue(mockLastLoggedInKeys),
          mget: jest.fn().mockResolvedValue(mockMemberLastLoggedInTimestamps),
          del: jest.fn().mockResolvedValue(null),
        });

      })

      it('should get the redis key last logged in', async () => {
        
        const porterRunner = application.get<PorterRunner>(Runner);
        await porterRunner.execute();
      
        expect(cacheService.getClient().get).toHaveBeenCalledWith('last-logged-in:*');
        expect(cacheService.getClient().mget).toHaveBeenCalledWith(mockLastLoggedInKeys);
      });

      it('should update member after get the value from redis', async () => {
        const porterRunner = application.get<PorterRunner>(Runner);
        
        await porterRunner.execute();
        const updatedMember = await memberRepo.findOneById(member.id);
        
        const updatedDateUTC = updatedMember.loginedAt.toUTCString();
        const expectedDateUTC = new Date(mockMemberLastLoggedInTimestamps[0]);
        expectedDateUTC.setHours(expectedDateUTC.getHours() - 8);
        const expectedDateString = expectedDateUTC.toUTCString();  
      
        expect(updatedDateUTC).toEqual(expectedDateString);
        expect(cacheService.getClient().del).toHaveBeenCalledWith(mockLastLoggedInKeys[0]);
      });


    })
  })
});
