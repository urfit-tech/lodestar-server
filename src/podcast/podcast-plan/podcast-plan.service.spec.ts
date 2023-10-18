import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { MemberInfrastructure } from '~/member/member.infra';
import { MemberService } from '~/member/member.service';
import { UtilityService } from '~/utility/utility.service';
import { PodcastPlanInfrastructure } from './podcast-plan.infra';
import { PodcastPlanService } from './podcast-plan.service';

describe('PodcastPlanService', () => {
  let service: PodcastPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PodcastPlanService,
        PodcastPlanInfrastructure,
        MemberService,
        EntityManager,
        UtilityService,
        DefinitionInfrastructure,
        MemberInfrastructure,
      ],
    }).compile();

    service = module.get<PodcastPlanService>(PodcastPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
