import { Test, TestingModule } from '@nestjs/testing';
import { ActivityTicketService } from './activity-ticket.service';
import { ActivityTicketInfrastructure } from './activity-ticket.infra';
import { EntityManager } from 'typeorm';
import { getEntityManagerToken } from '@nestjs/typeorm';

describe('ActivityTicketService', () => {
  let service: ActivityTicketService;
  let manager: EntityManager;

  const mockActivityTicketInfra = {
    getActivityTicketInfoByIdAndMemberId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityTicketService,
        {
          provide: ActivityTicketInfrastructure,
          useValue: mockActivityTicketInfra
        },
        {
          provide: getEntityManagerToken(),
          useValue: jest.fn() 
        }
      ],
    }).compile();

    service = module.get<ActivityTicketService>(ActivityTicketService);
    manager = module.get<EntityManager>(getEntityManagerToken());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

