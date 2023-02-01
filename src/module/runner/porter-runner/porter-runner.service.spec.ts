import { Test, TestingModule } from '@nestjs/testing'
import { PorterRunnerService } from './porter-runner.service'

describe('PorterRunnerService', () => {
  let service: PorterRunnerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PorterRunnerService],
    }).compile()

    service = module.get<PorterRunnerService>(PorterRunnerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
