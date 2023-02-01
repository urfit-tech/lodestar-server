import { Test, TestingModule } from '@nestjs/testing'
import { PaymentDebitorTaskerService } from './payment-debitor-tasker.service'

describe('PaymentDebitorTaskerService', () => {
  let service: PaymentDebitorTaskerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentDebitorTaskerService],
    }).compile()

    service = module.get<PaymentDebitorTaskerService>(PaymentDebitorTaskerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
