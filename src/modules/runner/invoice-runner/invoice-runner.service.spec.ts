import { Test, TestingModule } from '@nestjs/testing'
import { InvoiceRunnerService } from './invoice-runner.service'

describe('InvoiceRunnerService', () => {
  let service: InvoiceRunnerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceRunnerService],
    }).compile()

    service = module.get<InvoiceRunnerService>(InvoiceRunnerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
