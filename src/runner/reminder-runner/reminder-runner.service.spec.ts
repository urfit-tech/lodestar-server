import { Test, TestingModule } from '@nestjs/testing'
import { ReminderRunnerService } from './reminder-runner.service'

describe('ReminderRunnerService', () => {
  let service: ReminderRunnerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReminderRunnerService],
    }).compile()

    service = module.get<ReminderRunnerService>(ReminderRunnerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
