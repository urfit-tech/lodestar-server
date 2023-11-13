import { Test, TestingModule } from '@nestjs/testing';
import { PorterRunner } from '../../src/runner/porter.runner';
import { CacheService } from '~/utility/cache/cache.service';
import { v4 } from 'uuid';
import axios from 'axios'

const mockCacheService = {
  getClient: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue('last-logged-in:123'),
    mget: jest.fn().mockResolvedValue(['2023-01-01T00:00:00Z']),
    del: jest.fn().mockResolvedValue(null),
  }),
};

describe('PorterRunner', () => {
  let porterRunner: PorterRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PorterRunner,
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    porterRunner = module.get<PorterRunner>(PorterRunner);
  });


  it('should call the heartbeat URL if PORTER_HEARTBEAT_URL is set', async () => {
    const mockAxiosGet = jest.spyOn(axios, 'get').mockResolvedValue({});

    await porterRunner.execute();

    expect(mockAxiosGet).toHaveBeenCalledWith(process.env.PORTER_HEARTBEAT_URL);
  });


});
