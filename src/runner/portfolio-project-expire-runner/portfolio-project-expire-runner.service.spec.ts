import { Test, TestingModule } from '@nestjs/testing'
import { PortfolioProjectExpireRunnerService } from './portfolio-project-expire-runner.service'

describe('PortfolioProjectExpireRunnerService', () => {
  let service: PortfolioProjectExpireRunnerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PortfolioProjectExpireRunnerService],
    }).compile()

    service = module.get<PortfolioProjectExpireRunnerService>(PortfolioProjectExpireRunnerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
