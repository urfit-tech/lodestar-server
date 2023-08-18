import { Test, TestingModule } from '@nestjs/testing';
import { AtomeService } from './atome.service';

describe('AtomeService', () => {
  let service: AtomeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AtomeService],
    }).compile();

    service = module.get<AtomeService>(AtomeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
