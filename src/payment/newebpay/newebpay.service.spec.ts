import { Test, TestingModule } from '@nestjs/testing';
import { NewebpayService } from './newebpay.service';

describe('NewebpayService', () => {
  let service: NewebpayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NewebpayService],
    }).compile();

    service = module.get<NewebpayService>(NewebpayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
