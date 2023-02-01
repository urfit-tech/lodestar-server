import { Test, TestingModule } from '@nestjs/testing'
import { VoucherPlanService } from './voucher-plan.service'

describe('VoucherPlanService', () => {
  let service: VoucherPlanService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VoucherPlanService],
    }).compile()

    service = module.get<VoucherPlanService>(VoucherPlanService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
