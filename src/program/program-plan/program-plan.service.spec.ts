import { Test, TestingModule } from '@nestjs/testing'
import { ProgramPlanService } from './program-plan.service'

describe('ProgramPlanService', () => {
  let service: ProgramPlanService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgramPlanService],
    }).compile()

    service = module.get<ProgramPlanService>(ProgramPlanService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
