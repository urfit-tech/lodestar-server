import { Test, TestingModule } from '@nestjs/testing';
import { TemporallyExclusiveResourceService } from './temporally-exclusive-resource.service';

describe('TemporallyExclusiveResourceService', () => {
  let service: TemporallyExclusiveResourceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemporallyExclusiveResourceService],
    }).compile();

    service = module.get<TemporallyExclusiveResourceService>(TemporallyExclusiveResourceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
