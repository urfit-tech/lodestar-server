import { Test, TestingModule } from '@nestjs/testing'
import { AppointmentPlanService } from './appointment-plan.service'

describe('AppointmentPlanService', () => {
  let service: AppointmentPlanService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppointmentPlanService],
    }).compile()

    service = module.get<AppointmentPlanService>(AppointmentPlanService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
