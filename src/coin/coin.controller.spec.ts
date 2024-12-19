import { Test, TestingModule } from '@nestjs/testing';
import { CoinController } from './coin.controller';
import { ImporterTasker } from '~/tasker/importer.tasker';
import { JwtMember } from '~/auth/auth.dto';
import { CoinImportDTO } from './coin.dto';
import { Queue } from 'bull';
import { getQueueToken } from '@nestjs/bull';
import { PermissionGuard } from '~/auth/permission.guard';
import { AuthGuard } from '~/auth/auth.guard';

describe('CoinController', () => {
  let controller: CoinController;
  let importerQueue: Queue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoinController],
      providers: [
        {
          provide: getQueueToken(ImporterTasker.name),
          useValue: { add: jest.fn() },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<CoinController>(CoinController);
    importerQueue = module.get<Queue>(getQueueToken(ImporterTasker.name));
  });

  describe('importCoins', () => {
    it('Should add a job to the importer queue with the correct payload', async () => {
      const member: JwtMember = {
        appId: 'test-app-id',
        memberId: 'test-member-id',
        role: 'app-owner',
        permissions: ['COIN_ADMIN'],
        sub: '123',
      };
      const dto: CoinImportDTO = {
        appId: 'test-app-id',
        fileInfos: [
          { key: 'file1.csv', checksum: 'abc123' },
          { key: 'file2.csv', checksum: 'def456' },
        ],
      };

      const addSpy = jest.spyOn(importerQueue, 'add');
      await controller.importCoins(member, dto);

      expect(addSpy).toHaveBeenCalledWith(
        {
          appId: dto.appId,
          invokerMemberId: member.memberId,
          category: 'coin',
          fileInfos: [
            { fileName: 'file1.csv', checksumETag: 'abc123' },
            { fileName: 'file2.csv', checksumETag: 'def456' },
          ],
        },
        { removeOnComplete: true, removeOnFail: true },
      );
    });
  });
});
