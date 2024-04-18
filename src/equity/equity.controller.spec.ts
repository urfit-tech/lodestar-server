import { Test, TestingModule } from '@nestjs/testing';
import { EquityController } from './equity.controller';

describe('EquityController', () => {
  let controller: EquityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquityController],
    }).compile();

    controller = module.get<EquityController>(EquityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
