import { Test, TestingModule } from '@nestjs/testing'
import { PaymentRenewRunnerService } from './payment-renew-runner.service'

describe('PaymentRenewRunnerService', () => {
  let service: PaymentRenewRunnerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentRenewRunnerService],
    }).compile()

    service = module.get<PaymentRenewRunnerService>(PaymentRenewRunnerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
