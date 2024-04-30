import { Test, TestingModule } from '@nestjs/testing';
import { ProgramPackageService } from './program-package.service';
import { MemberService } from '~/member/member.service';
import { ProgramPackageInfrastructure } from './program-package.infra';
import { EntityManager } from 'typeorm';
import { ProgramInfrastructure } from '~/program/program.infra';
import { APIException } from '~/api.excetion';
import { Cursor } from 'typeorm-cursor-pagination';

describe('ProgramPackageService', () => {
  let service: ProgramPackageService;
  let memberService: MemberService;
  let programPackageInfra: ProgramPackageInfrastructure;
  let entityManager: EntityManager;
  let programInfra: ProgramInfrastructure;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramPackageService,
        {
          provide: MemberService,
          useValue: {
            getMembersByCondition: jest.fn(),
          },
        },
        {
          provide: ProgramPackageInfrastructure,
          useValue: {
            getOwnedProgramPackages: jest.fn(),
            getExpiredProgramPackages: jest.fn(),
            getEnrolledProgramPackageById: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {},
        },
        {
          provide: ProgramInfrastructure,
          useValue: {
            getProgramCategories: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProgramPackageService>(ProgramPackageService);
    memberService = module.get<MemberService>(MemberService);
    programPackageInfra = module.get<ProgramPackageInfrastructure>(ProgramPackageInfrastructure);
    entityManager = module.get<EntityManager>(EntityManager);
    programInfra = module.get<ProgramInfrastructure>(ProgramInfrastructure);
  });

  describe('getProgramPackageByMemberId', () => {
    it('should return owned program packages if member exists', async () => {
      const cursor: Cursor = {
        beforeCursor: null,
        afterCursor: null,
      };

      jest.spyOn(memberService, 'getMembersByCondition').mockResolvedValue({
        data: [
          {
            id: 'member1',
            picture_url: '',
            name: '',
            email: '',
            role: '',
            created_at: new Date(),
            username: '',
            logined_at: new Date(),
            manager_id: '',
          },
        ],
        cursor: cursor,
      });
      jest.spyOn(programPackageInfra, 'getOwnedProgramPackages').mockResolvedValue([]);

      const result = await service.getProgramPackageByMemberId('appId', 'member1');
      expect(result).toEqual([]);
      expect(memberService.getMembersByCondition).toHaveBeenCalledWith('appId', { limit: 1 }, { id: 'member1' });
      expect(programPackageInfra.getOwnedProgramPackages).toHaveBeenCalledWith('member1', entityManager);
    });

    it('should throw APIException if no member is found', async () => {
      const cursor: Cursor = {
        beforeCursor: null,
        afterCursor: null,
      };

      jest.spyOn(memberService, 'getMembersByCondition').mockResolvedValue({ data: [], cursor: cursor });

      await expect(service.getProgramPackageByMemberId('appId', 'member1')).rejects.toThrow(APIException);
    });
  });
});
