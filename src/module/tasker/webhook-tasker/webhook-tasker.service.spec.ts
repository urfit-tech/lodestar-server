import { Test, TestingModule } from '@nestjs/testing'
import { WebhookTaskerService } from './webhook-tasker.service'

describe('WebhookTaskerService', () => {
  let service: WebhookTaskerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookTaskerService],
    }).compile()

    service = module.get<WebhookTaskerService>(WebhookTaskerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
