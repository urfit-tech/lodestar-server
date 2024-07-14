import { Test, TestingModule } from '@nestjs/testing';
import { MerchandiseService } from './merchandise-spec/merchandise-spec.service';

describe('MerchandiseService', () => {
  let service: MerchandiseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MerchandiseService],
    }).compile();

    service = module.get<MerchandiseService>(MerchandiseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
