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

jest.mock('axios', () => ({
  get: jest.fn()
}));

describe('PorterRunner', () => {
  let application: INestApplication;
  
  let cacheService: CacheService;
  let manager: EntityManager;
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
    }).compile();

    application = moduleFixture.createNestApplication();

    cacheService = application.get<CacheService>(CacheService);
    manager = application.get<EntityManager>(getEntityManagerToken());
    memberRepo = manager.getRepository(Member);
    

    await memberRepo.delete({});
    
    await application.init();
  });

  afterAll(async () => {
    await application.close();
  });


  it('should call the heartbeat URL if PORTER_HEARTBEAT_URL is set', async () => {
    const mockedAxiosGet = axios.get as jest.Mock;
    const testUrl = 'http://test-heartbeat-url.com';
    process.env.PORTER_HEARTBEAT_URL = testUrl;

    mockedAxiosGet.mockResolvedValue({}); 

    const porterRunner = application.get<PorterRunner>(Runner);
    await porterRunner.execute();

    expect(mockedAxiosGet).toHaveBeenCalledWith(testUrl);
  });


});
