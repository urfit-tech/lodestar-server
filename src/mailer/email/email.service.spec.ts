import { getQueueToken } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';

import { AppInfrastructure } from '~/app/app.infra';

import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let mockAppInfra = {};
  let mockMailerQueue = {};
  let mockEntityManager = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: AppInfrastructure,
          useValue: mockAppInfra,
        },
        {
          // provide: getQueueToken(MailerTasker.name),
          provide: getQueueToken('mailer'),
          useValue: mockMailerQueue,
        },
        {
          provide: getEntityManagerToken(),
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
