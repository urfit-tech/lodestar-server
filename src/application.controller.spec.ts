import { Test, TestingModule } from '@nestjs/testing'
import { ApplicationController } from './application.controller'
import { ApplicationService } from './application.service'

describe('AppController', () => {
  let applicationController: ApplicationController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationController],
      providers: [ApplicationService],
    }).compile()

    applicationController = app.get<ApplicationController>(ApplicationController)
  })

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(applicationController.getHello()).toBe('Hello World!')
    })
  })
})
