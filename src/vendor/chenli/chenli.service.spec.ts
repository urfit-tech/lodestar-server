import { Test, TestingModule } from '@nestjs/testing'
import { ChenliService } from './chenli.service'

describe('ChenliService', () => {
  let service: ChenliService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChenliService],
    }).compile()

    service = module.get<ChenliService>(ChenliService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
