import { Test, TestingModule } from '@nestjs/testing'
import { ChargerRunnerService } from './charger-runner.service'

describe('ChargerRunnerService', () => {
  let service: ChargerRunnerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChargerRunnerService],
    }).compile()

    service = module.get<ChargerRunnerService>(ChargerRunnerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
