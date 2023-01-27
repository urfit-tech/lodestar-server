import { Test, TestingModule } from '@nestjs/testing'
import { BackupRunnerService } from './backup-runner.service'

describe('BackupRunnerService', () => {
  let service: BackupRunnerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BackupRunnerService],
    }).compile()

    service = module.get<BackupRunnerService>(BackupRunnerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
