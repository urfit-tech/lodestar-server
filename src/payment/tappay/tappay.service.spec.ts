import { Test, TestingModule } from '@nestjs/testing'
import { TappayService } from './tappay.service'

describe('TappayService', () => {
  let service: TappayService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TappayService],
    }).compile()

    service = module.get<TappayService>(TappayService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
