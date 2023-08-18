import { Test, TestingModule } from '@nestjs/testing';
import { CwgService } from './cwg.service';

describe('CwgService', () => {
  let service: CwgService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CwgService],
    }).compile();

    service = module.get<CwgService>(CwgService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
