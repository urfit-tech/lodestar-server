import { Test, TestingModule } from '@nestjs/testing';
import { TemporallyExclusiveResourceController } from './temporally-exclusive-resource.controller';
import { TemporallyExclusiveResourceService } from './temporally-exclusive-resource.service';

describe('TemporallyExclusiveResourceController', () => {
  let controller: TemporallyExclusiveResourceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemporallyExclusiveResourceController],
      providers: [TemporallyExclusiveResourceService],
    }).compile();

    controller = module.get<TemporallyExclusiveResourceController>(TemporallyExclusiveResourceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
