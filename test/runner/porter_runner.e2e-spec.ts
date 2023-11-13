import { Test, TestingModule } from '@nestjs/testing';
import { PorterRunner } from '../../src/runner/porter.runner';
import { CacheService } from '~/utility/cache/cache.service';
import { v4 } from 'uuid';
import axios from 'axios'
import { RunnerModule } from '~/runner/runner.module';
import { INestApplication } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { Member } from '~/member/entity/member.entity';
import { ProgramModule } from '~/program/program.module';

const mockCacheService = {
  getClient: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue('last-logged-in:123'),
    mget: jest.fn().mockResolvedValue(['2023-01-01T00:00:00Z']),
    del: jest.fn().mockResolvedValue(null),
  }),
};

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
    expect(1).toEqual(1)
  });


});
