import { Test, TestingModule } from '@nestjs/testing';
import { PaypalService } from './paypal.service';

describe('PaypalService', () => {
  let service: PaypalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaypalService],
    }).compile();

    service = module.get<PaypalService>(PaypalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
