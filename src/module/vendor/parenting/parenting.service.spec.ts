import { Test, TestingModule } from '@nestjs/testing'
import { ParentingService } from './parenting.service'

describe('ParentingService', () => {
  let service: ParentingService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParentingService],
    }).compile()

    service = module.get<ParentingService>(ParentingService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
