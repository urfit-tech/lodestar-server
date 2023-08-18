import { Test, TestingModule } from '@nestjs/testing';
import { CoinService } from './coin.service';

describe('CoinService', () => {
  let service: CoinService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoinService],
    }).compile();

    service = module.get<CoinService>(CoinService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
