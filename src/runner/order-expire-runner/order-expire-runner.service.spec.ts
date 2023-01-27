import { Test, TestingModule } from '@nestjs/testing'
import { OrderExpireRunnerService } from './order-expire-runner.service'

describe('OrderExpireRunnerService', () => {
  let service: OrderExpireRunnerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderExpireRunnerService],
    }).compile()

    service = module.get<OrderExpireRunnerService>(OrderExpireRunnerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
