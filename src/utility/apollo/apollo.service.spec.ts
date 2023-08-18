import { Test, TestingModule } from '@nestjs/testing';
import { ApolloService } from './apollo.service';

describe('ApolloService', () => {
  let service: ApolloService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApolloService],
    }).compile();

    service = module.get<ApolloService>(ApolloService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
