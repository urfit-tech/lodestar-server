import { Test, TestingModule } from '@nestjs/testing'
import { PodcastPlanService } from './podcast-plan.service'

describe('PodcastPlanService', () => {
  let service: PodcastPlanService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PodcastPlanService],
    }).compile()

    service = module.get<PodcastPlanService>(PodcastPlanService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
