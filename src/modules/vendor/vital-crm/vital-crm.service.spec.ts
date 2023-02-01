import { Test, TestingModule } from '@nestjs/testing'
import { VitalCrmService } from './vital-crm.service'

describe('VitalCrmService', () => {
  let service: VitalCrmService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VitalCrmService],
    }).compile()

    service = module.get<VitalCrmService>(VitalCrmService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
