import { Test, TestingModule } from '@nestjs/testing'
import { ImporterTaskerService } from './importer-tasker.service'

describe('ImporterTaskerService', () => {
  let service: ImporterTaskerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImporterTaskerService],
    }).compile()

    service = module.get<ImporterTaskerService>(ImporterTaskerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
