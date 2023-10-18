import { Test, TestingModule } from '@nestjs/testing';
import { ProgramPackagePlanService } from './program-package-plan.service';

describe('ProgramPackagePlanService', () => {
  let service: ProgramPackagePlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgramPackagePlanService],
    }).compile();

    service = module.get<ProgramPackagePlanService>(ProgramPackagePlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
