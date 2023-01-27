import { Test, TestingModule } from '@nestjs/testing'
import { ActivityTicketService } from './activity-ticket.service'

describe('ActivityTicketService', () => {
  let service: ActivityTicketService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityTicketService],
    }).compile()

    service = module.get<ActivityTicketService>(ActivityTicketService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
