import { Test, TestingModule } from '@nestjs/testing';
import { TemporallyExclusiveResourceRruleController } from './temporally-exclusive-resource-rrule.controller';
import { TemporallyExclusiveResourceRruleService } from './temporally-exclusive-resource-rrule.service';

describe('TemporallyExclusiveResourceRruleController', () => {
  let controller: TemporallyExclusiveResourceRruleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemporallyExclusiveResourceRruleController],
      providers: [TemporallyExclusiveResourceRruleService],
    }).compile();

    controller = module.get<TemporallyExclusiveResourceRruleController>(TemporallyExclusiveResourceRruleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
