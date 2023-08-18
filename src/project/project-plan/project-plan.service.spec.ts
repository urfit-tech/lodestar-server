import { Test, TestingModule } from '@nestjs/testing';
import { ProjectPlanService } from './project-plan.service';

describe('ProjectPlanService', () => {
  let service: ProjectPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectPlanService],
    }).compile();

    service = module.get<ProjectPlanService>(ProjectPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
