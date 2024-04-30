import { Test, TestingModule } from '@nestjs/testing';
import { EbookController } from './ebook.controller';
import { EbookService } from './ebook.service';
import { ProgramService } from '~/program/program.service';
import { AuthService } from '~/auth/auth.service';
import { Response } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { Readable } from 'node:stream';

describe('EbookController', () => {
  let controller: EbookController;
  let ebookService: EbookService;
  let programService: ProgramService;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EbookController],
      providers: [
        {
          provide: EbookService,
          useValue: {
            processEbook: jest.fn(),
          },
        },
        {
          provide: ProgramService,
          useValue: {
            getProgramContentById: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EbookController>(EbookController);
    ebookService = module.get<EbookService>(EbookService);
    programService = module.get<ProgramService>(ProgramService);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStandardEbook', () => {
    it('should successfully return an ebook stream', async () => {
      const mockReq = { headers: {}, params: {} } as any;
      const mockRes = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
        pipe: jest.fn(),
      } as unknown as Response;
      const readableStream = new Readable();
      const programContentId = '123';
      const authorization = 'Bearer token';

      jest.spyOn(programService, 'getProgramContentById').mockResolvedValue({ appId: 'appId', displayMode: 'full' });
      jest.spyOn(ebookService, 'processEbook').mockResolvedValue(readableStream);
      jest.spyOn(authService, 'verify').mockReturnValue({ valid: true });

      await controller.getStandardEbook(programContentId, mockReq, mockRes, authorization);

      expect(programService.getProgramContentById).toHaveBeenCalledWith('123');
      expect(ebookService.processEbook).toHaveBeenCalledWith('appId', programContentId, mockReq, false);
    });

    it('should throw an UnauthorizedException if no token is provided and ebook is not in trial mode', async () => {
      const mockReq = { headers: {}, params: {} } as any;
      const mockRes = {} as unknown as Response;
      const programContentId = '123';

      jest.spyOn(programService, 'getProgramContentById').mockResolvedValue({ appId: 'appId', displayMode: 'full' });

      await expect(controller.getStandardEbook(programContentId, mockReq, mockRes, undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
