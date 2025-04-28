import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { v4 } from 'uuid';
import { Member } from '~/member/entity/member.entity';
import { CoinCsvHeaderMapping } from './class/csvHeaderMapping';
import { CoinService } from './coin.service';

describe('CoinService', () => {
  let service: CoinService;
  let manager: EntityManager;

  const mockMemberRepo = {
    findOne: jest.fn(),
  };

  const mockCoinLogRepo = {
    save: jest.fn(),
  };

  const mockEntityManager = {
    getRepository: () => mockCoinLogRepo,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinService,
        {
          provide: getEntityManagerToken(),
          useValue: {
            getRepository: jest.fn(() => mockMemberRepo),
            transaction: jest.fn(cb => {
              return cb(mockEntityManager);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CoinService>(CoinService);
    manager = module.get<EntityManager>(getEntityManagerToken());
  });

  afterEach(() => jest.resetAllMocks());

  describe('#rawCsvToCoinLog', () => {
    const headerRow = {
      信箱: 'email',
      項目: 'title',
      代幣數量: 'amount',
      代幣開始時間: 'startedAt',
      代幣結束時間: 'endedAt',
      備註: 'note',
      描述: 'description',
      領取時間: 'claimedAt',
      領取開始時間: 'claimStartedAt',
      領取結束時間: 'claimEndedAt',
      建立時間: 'createdAt',
    };

    it('Should process all', async () => {
      const member = new Member();
      member.id = v4();
      member.appId = 'test-app-id';
      member.email = 'test@example.com';

      mockMemberRepo.findOne.mockResolvedValueOnce(member);
      const rawRows = [
        headerRow,
        {
          信箱: 'test@example.com',
          項目: 'test_title',
          代幣數量: '100',
          代幣開始時間: '',
          代幣結束時間: '',
          備註: '',
          描述: '',
          領取時間: '',
          領取開始時間: '',
          領取結束時間: '',
          建立時間: '',
        },
      ];

      const [headerInfos, _] = new CoinCsvHeaderMapping().deserializeFromRaw(rawRows.shift());
      const [deserializeResult] = await service.rawCsvToCoinLog('test-app-id', headerInfos, rawRows, manager);
      const [coinLog] = deserializeResult;

      expect(coinLog.memberId).toBe(member.id);
      expect(coinLog.title).toBe('test_title');
      expect(coinLog.amount).toBe(100);
    });

    it('Should skip invalid email row', async () => {
      const member = new Member();
      member.id = v4();
      member.appId = 'test-app-id';
      member.email = 'test@example.com';

      mockMemberRepo.findOne.mockResolvedValueOnce(member);
      const rawRows = [
        headerRow,
        {
          信箱: '',
          項目: 'test_title',
          代幣數量: '100',
          代幣開始時間: '',
          代幣結束時間: '',
          備註: '',
          描述: '',
          領取時間: '',
          領取開始時間: '',
          領取結束時間: '',
          建立時間: '',
        },
        {
          信箱: 'test@example.com',
          項目: 'test_title',
          代幣數量: '100',
          代幣開始時間: '',
          代幣結束時間: '',
          備註: '',
          描述: '',
          領取時間: '',
          領取開始時間: '',
          領取結束時間: '',
          建立時間: '',
        },
      ];

      const [headerInfos, _] = new CoinCsvHeaderMapping().deserializeFromRaw(rawRows.shift());
      const deserializeResults = await service.rawCsvToCoinLog('test-app-id', headerInfos, rawRows, manager);
      const errorResults = deserializeResults.filter(([coinLog]) => coinLog === null);
      const [errorResult] = errorResults;
      const [errorCoinLog, errors] = errorResult;
      expect(errorCoinLog).toBeNull();
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints.isEmail).not.toBeUndefined();
      const successResults = deserializeResults.filter(([coinLog]) => coinLog !== null);
      expect(successResults.length).toBe(1);
      const [successResult] = successResults;
      const [coinLog, error] = successResult;
      expect(error.length).toBe(0);
      expect(coinLog.memberId).toBe(member.id);
      expect(coinLog.title).toBe('test_title');
      expect(coinLog.amount).toBe(100);
      expect(coinLog.note).toBeNull();
      expect(coinLog.startedAt).toBeNull();
      expect(coinLog.endedAt).toBeNull();
      expect(coinLog.claimedAt).toBeNull();
    });

    it('Should skip invalid member not found', async () => {
      const member = new Member();
      member.id = v4();
      member.appId = 'test-app-id';
      member.email = 'test@example.com';

      mockMemberRepo.findOne.mockResolvedValueOnce(member);
      const rawRows = [
        headerRow,
        {
          信箱: 'test2@example.com',
          項目: 'test_title',
          代幣數量: '100',
          代幣開始時間: '',
          代幣結束時間: '',
          備註: '',
          描述: '',
          領取時間: '',
          領取開始時間: '',
          領取結束時間: '',
          建立時間: '',
        },
        {
          信箱: 'test@example.com',
          項目: 'test_title',
          代幣數量: '100',
          代幣開始時間: '',
          代幣結束時間: '',
          備註: '',
          描述: '',
          領取時間: '',
          領取開始時間: '',
          領取結束時間: '',
          建立時間: '',
        },
      ];

      const [headerInfos, _] = new CoinCsvHeaderMapping().deserializeFromRaw(rawRows.shift());
      const deserializeResults = await service.rawCsvToCoinLog('test-app-id', headerInfos, rawRows, manager);
      const errorResults = deserializeResults.filter(([coinLog]) => coinLog === null);
      const [errorResult] = errorResults;
      const [errorCoinLog, errors] = errorResult;
      expect(errorCoinLog).toBeNull();
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints.memberNotFound).not.toBeUndefined();
      const successResults = deserializeResults.filter(([coinLog]) => coinLog !== null);
      expect(successResults.length).toBe(1);
      const [successResult] = successResults;
      const [coinLog, error] = successResult;
      expect(error.length).toBe(0);
      expect(coinLog.memberId).toBe(member.id);
      expect(coinLog.title).toBe('test_title');
      expect(coinLog.amount).toBe(100);
      expect(coinLog.note).toBeNull();
      expect(coinLog.startedAt).toBeNull();
      expect(coinLog.endedAt).toBeNull();
      expect(coinLog.claimedAt).toBeNull();
    });

    it('Should raise error with invalid date', async () => {
      const rawRows = [
        headerRow,
        {
          信箱: 'test@example.com',
          項目: 'test_title',
          代幣數量: '100',
          代幣開始時間: 'invalid_date',
          代幣結束時間: '',
          備註: '',
          描述: '',
          領取時間: '',
          領取開始時間: '',
          領取結束時間: '',
          建立時間: '',
        },
      ];

      const [headerInfos, _] = new CoinCsvHeaderMapping().deserializeFromRaw(rawRows.shift());
      const [deserializeResult] = await service.rawCsvToCoinLog('test-app-id', headerInfos, rawRows, manager);
      const [coinLog, errors] = deserializeResult;

      expect(coinLog).toBeNull();
      expect(errors.length).toBe(1);
    });

    it('Should return successful import result when valid data is provided', async () => {
      const member = new Member();
      member.id = v4();
      member.appId = 'test-app-id';
      member.email = 'test@example.com';

      mockMemberRepo.findOne.mockResolvedValueOnce(member);

      const rawRows = [
        headerRow,
        {
          信箱: 'test@example.com',
          項目: 'test_title',
          代幣數量: '100',
          代幣開始時間: '',
          代幣結束時間: '',
          備註: '',
          描述: '',
          領取時間: '',
          領取開始時間: '',
          領取結束時間: '',
          建立時間: '',
        },
      ];

      const coinLogImportResult = await service.processImportFromFile('test-app-id', rawRows);

      expect(mockCoinLogRepo.save).toHaveBeenCalled();
      expect(coinLogImportResult.insertedCount).toBe(1);
      expect(coinLogImportResult.failedCount).toBe(0);
    });

    it('Should return error when header deserialization fails', async () => {
      const rawRows = [{}];

      const [_, headerErrors] = new CoinCsvHeaderMapping().deserializeFromRaw(rawRows.shift());

      const coinImportResult = await service.processImportFromFile('test-app-id', rawRows);

      expect(headerErrors.length).toBeGreaterThan(0);
      expect(coinImportResult.failedCount).toBe(0);
      expect(coinImportResult.insertedCount).toBe(0);
      expect(coinImportResult.failedCount).toBe(0);
      expect(coinImportResult.failedErrors.length).toBeGreaterThan(0);
    });

    it('Should raise error with invalid date format', async () => {
      const member = new Member();
      member.id = v4();
      member.appId = 'test-app-id';
      member.email = 'test@example.com';

      mockMemberRepo.findOne.mockResolvedValueOnce(member);
      const rawRows = [
        headerRow,
        {
          信箱: 'test@example.com',
          項目: 'test_title',
          代幣數量: '100',
          代幣開始時間: 'invalid_date_format',
          代幣結束時間: '',
          備註: '',
          描述: '',
          領取時間: '',
          領取開始時間: '',
          領取結束時間: '',
          建立時間: '',
        },
      ];

      const [headerInfos, _] = new CoinCsvHeaderMapping().deserializeFromRaw(rawRows.shift());
      const [deserializeResult] = await service.rawCsvToCoinLog('test-app-id', headerInfos, rawRows, manager);
      const [errorCoinLog, errors] = deserializeResult;
      expect(errorCoinLog).toBeNull();
      expect(errors[0].property).toBe('startedAt');
      expect(errors[0].constraints.isDateString).not.toBeUndefined();
    });

    it('Should raise error with missing required fields', async () => {
      const member = new Member();
      member.id = v4();
      member.appId = 'test-app-id';
      member.email = 'test@example.com';

      mockMemberRepo.findOne.mockResolvedValueOnce(member);
      const rawRows = [
        headerRow,
        {
          信箱: 'test@example.com',
          項目: 'test_title',
          代幣數量: '', // Missing required field
          代幣開始時間: '',
          代幣結束時間: '',
          備註: '',
          描述: '',
          領取時間: '',
          領取開始時間: '',
          領取結束時間: '',
          建立時間: '',
        },
      ];

      const coinImportResult = await service.processImportFromFile('test-app-id', rawRows);

      expect(coinImportResult.toInsertCount).toBe(1);
      expect(coinImportResult.insertedCount).toBe(0);
      expect(coinImportResult.failedCount).toBe(1);
      expect(coinImportResult.failedErrors).toHaveLength(1);

      const errorEntry = coinImportResult.failedErrors[0];
      expect(errorEntry['test@example.com/test_title']).toBeDefined();

      const errorDetails = errorEntry['test@example.com/test_title'];
      expect(errorDetails).toHaveLength(1);

      const error = errorDetails[0];
      expect(error.property).toBe('amount');
      expect(error.value).toBeUndefined();
      expect(error.constraints).toEqual({
        isNotEmpty: 'amount should not be empty',
        isNumberString: 'amount must be a number string',
      });
    });

    it('Should handle errors during transaction', async () => {
      const member = new Member();
      member.id = v4();
      member.appId = 'test-app-id';
      member.email = 'test@example.com';

      mockMemberRepo.findOne.mockResolvedValueOnce(member);

      const rawRows = [
        headerRow,
        {
          信箱: 'test@example.com',
          項目: 'test_title',
          代幣數量: '100',
          代幣開始時間: '',
          代幣結束時間: '',
          備註: '',
          描述: '',
          領取時間: '',
          領取開始時間: '',
          領取結束時間: '',
          建立時間: '',
        },
      ];

      mockCoinLogRepo.save.mockRejectedValueOnce(new Error('Transaction failed'));

      const coinLogImportResult = await service.processImportFromFile('test-app-id', rawRows);

      expect(coinLogImportResult.failedCount).toBe(1);
      expect(coinLogImportResult.failedErrors).toContainEqual(expect.stringContaining('Transaction failed'));
    });
  });
});
