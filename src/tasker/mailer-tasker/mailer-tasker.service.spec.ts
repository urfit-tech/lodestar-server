import { Test, TestingModule } from '@nestjs/testing'
import { MailerTaskerService } from './mailer-tasker.service'

describe('MailerTaskerService', () => {
  let service: MailerTaskerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailerTaskerService],
    }).compile()

    service = module.get<MailerTaskerService>(MailerTaskerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
