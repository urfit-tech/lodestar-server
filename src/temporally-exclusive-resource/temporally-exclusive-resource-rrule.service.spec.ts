import { Test, TestingModule } from '@nestjs/testing';
import { TemporallyExclusiveResourceRruleService } from './temporally-exclusive-resource-rrule.service';

describe('TemporallyExclusiveResourceRruleService', () => {
  let service: TemporallyExclusiveResourceRruleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemporallyExclusiveResourceRruleService],
    }).compile();

    service = module.get<TemporallyExclusiveResourceRruleService>(TemporallyExclusiveResourceRruleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
