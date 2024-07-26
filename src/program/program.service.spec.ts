import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { ProgramService } from './program.service';
import { MemberService } from '~/member/member.service';
import { ProgramInfrastructure } from './program.infra';

describe('ProgramService', () => {
  let service: ProgramService;
  let manager: EntityManager;

  const mockMemberService = {
    getMembersByCondition: jest.fn(),
  };

  const mockProgramInfrastructure = {
    getProgramContentProgressByIdAndMemberId: jest.fn(),
    trackProgramContentProgress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramService,
        {
          provide: MemberService,
          useValue: mockMemberService,
        },
        {
          provide: ProgramInfrastructure,
          useValue: mockProgramInfrastructure,
        },
        {
          provide: getEntityManagerToken(),
          useValue: jest.fn(),
        },
      ],
    }).compile();

    service = module.get<ProgramService>(ProgramService);
    manager = module.get<EntityManager>(getEntityManagerToken());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trackProgramContentProgress', () => {
    it('should throw an error if memberId is not provided', async () => {
      const params = {
        memberId: '',
        programContentId: null,
        progress: 50,
        lastProgress: 25,
      };

      await expect(service.trackProgramContentProgress(params)).rejects.toThrow('memberId must be provided');
    });

    it('should throw an error if ProgramContentId is not provided', async () => {
      const params = {
        memberId: 'uuid',
        programContentId: '',
        progress: 50,
        lastProgress: 25,
      };

      await expect(service.trackProgramContentProgress(params)).rejects.toThrow('programContentId must be provided');
    });

    it('should track progress successfully when no existing progress', async () => {
      const params = {
        memberId: 'member1',
        programContentId: 'content1',
        progress: 50,
        lastProgress: 25,
      };

      mockProgramInfrastructure.getProgramContentProgressByIdAndMemberId.mockResolvedValueOnce(null);

      await service.trackProgramContentProgress(params);

      expect(mockProgramInfrastructure.getProgramContentProgressByIdAndMemberId).toHaveBeenCalledWith(
        params.programContentId,
        params.memberId,
        manager,
      );

      expect(mockProgramInfrastructure.trackProgramContentProgress).toHaveBeenCalledWith(
        {
          memberId: params.memberId,
          programContentId: params.programContentId,
          progress: params.progress,
          lastProgress: params.lastProgress,
        },
        manager,
      );
    });

    it('should track progress successfully when existing progress is less than new progress', async () => {
      const params = {
        memberId: 'member1',
        programContentId: 'content1',
        progress: 50,
        lastProgress: 25,
      };

      mockProgramInfrastructure.getProgramContentProgressByIdAndMemberId.mockResolvedValueOnce({ progress: 40 });

      await service.trackProgramContentProgress(params);

      expect(mockProgramInfrastructure.getProgramContentProgressByIdAndMemberId).toHaveBeenCalledWith(
        params.programContentId,
        params.memberId,
        manager,
      );

      expect(mockProgramInfrastructure.trackProgramContentProgress).toHaveBeenCalledWith(
        {
          memberId: params.memberId,
          programContentId: params.programContentId,
          progress: params.progress,
          lastProgress: params.lastProgress,
        },
        manager,
      );
    });

    it('should track progress successfully when existing progress is greater than new progress', async () => {
      const params = {
        memberId: 'member1',
        programContentId: 'content1',
        progress: 50,
        lastProgress: 25,
      };

      mockProgramInfrastructure.getProgramContentProgressByIdAndMemberId.mockResolvedValueOnce({ progress: 60 });

      await service.trackProgramContentProgress(params);

      expect(mockProgramInfrastructure.getProgramContentProgressByIdAndMemberId).toHaveBeenCalledWith(
        params.programContentId,
        params.memberId,
        manager,
      );

      expect(mockProgramInfrastructure.trackProgramContentProgress).toHaveBeenCalledWith(
        {
          memberId: params.memberId,
          programContentId: params.programContentId,
          progress: 60,
          lastProgress: params.lastProgress,
        },
        manager,
      );
    });

    it('should keep existing progress and lastProgress if new values are null or undefined', async () => {
      const params = {
        memberId: 'member1',
        programContentId: 'content1',
        progress: null,
        lastProgress: undefined,
      };

      mockProgramInfrastructure.getProgramContentProgressByIdAndMemberId.mockResolvedValueOnce({
        progress: 40,
        lastProgress: 20,
      });

      await service.trackProgramContentProgress(params);

      expect(mockProgramInfrastructure.getProgramContentProgressByIdAndMemberId).toHaveBeenCalledWith(
        params.programContentId,
        params.memberId,
        manager,
      );

      expect(mockProgramInfrastructure.trackProgramContentProgress).toHaveBeenCalledWith(
        {
          memberId: params.memberId,
          programContentId: params.programContentId,
          progress: 40,
          lastProgress: 20,
        },
        manager,
      );
    });

    it('should throw an error if tracking progress fails', async () => {
      const params = {
        memberId: 'member1',
        programContentId: 'content1',
        progress: 50,
        lastProgress: 25,
      };

      mockProgramInfrastructure.getProgramContentProgressByIdAndMemberId.mockResolvedValueOnce(null);
      mockProgramInfrastructure.trackProgramContentProgress.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.trackProgramContentProgress(params)).rejects.toThrow(
        `Failed to track progress for content ${params.programContentId}: Database error`,
      );

      expect(mockProgramInfrastructure.getProgramContentProgressByIdAndMemberId).toHaveBeenCalledWith(
        params.programContentId,
        params.memberId,
        manager,
      );

      expect(mockProgramInfrastructure.trackProgramContentProgress).toHaveBeenCalledWith(
        {
          memberId: params.memberId,
          programContentId: params.programContentId,
          progress: params.progress,
          lastProgress: params.lastProgress,
        },
        manager,
      );
    });
  });
});
