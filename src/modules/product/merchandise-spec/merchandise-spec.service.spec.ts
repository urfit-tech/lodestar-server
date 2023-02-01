import { Test, TestingModule } from '@nestjs/testing'
import { MerchandiseSpecService } from './merchandise-spec.service'

describe('MerchandiseSpecService', () => {
  let service: MerchandiseSpecService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MerchandiseSpecService],
    }).compile()

    service = module.get<MerchandiseSpecService>(MerchandiseSpecService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
