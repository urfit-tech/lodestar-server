import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { App } from '~/app/entity/app.entity';
import { ApplicationModule } from '~/application.module';
import { CoinService } from '~/coin/coin.service';
import { AppPlan } from '~/entity/AppPlan';
import { CoinLog } from '~/entity/CoinLog';
import { Member } from '~/member/entity/member.entity';
import { appPlan, app, member } from '../data';

describe('CoinService (e2e)', () => {
  let application: INestApplication;
  let service: CoinService;

  let manager: EntityManager;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let coinLogRepo: Repository<CoinLog>;
  let memberRepo: Repository<Member>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture.createNestApplication();
    service = application.get(CoinService);

    manager = application.get<EntityManager>(getEntityManagerToken());
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    coinLogRepo = manager.getRepository(CoinLog);
    memberRepo = manager.getRepository(Member);

    await coinLogRepo.delete({});
    await memberRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});

    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await memberRepo.save(member);

    await application.init();
  });

  afterEach(async () => {
    await coinLogRepo.delete({});
    await memberRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});

    await application.close();
  });

  describe('Method processImportFile', () => {
    const headerRow = {
      信箱: 'email',
      項目: 'title',
      代幣數量: 'amount',
      代幣開始時間: 'startedAt',
      代幣結束時間: 'endedAt',
      備註: 'note',
      描述: 'description',
      領取時間: 'claimedAt',
      建立時間: 'createdAt',
    };
    it('Should return header error', async () => {
      const rawRows = [{}];
      const { toInsertCount, insertedCount, failedCount, failedErrors } = await service.processImportFromFile(
        app.id,
        rawRows,
      );
      expect(toInsertCount).toBe(0);
      expect(insertedCount).toBe(0);
      expect(failedCount).toBe(0);
      expect(failedErrors.length).toBeGreaterThan(0);

      const missingIdError = failedErrors.find(({ property }) => property === 'email');
      expect(missingIdError).not.toBeUndefined();
      expect(missingIdError.constraints.isNotEmpty).not.toBeUndefined();
      expect(missingIdError.constraints.isString).not.toBeUndefined();
    });

    it('Should return data error', async () => {
      const rawRows = [
        headerRow,
        {
          信箱: 'test@example.com',
          項目: 'title',
          代幣數量: '',
          代幣開始時間: '',
          代幣結束時間: '',
          備註: '',
          描述: '',
          領取時間: '',
          建立時間: '',
        },
      ];

      const { toInsertCount, insertedCount, failedCount, failedErrors } = await service.processImportFromFile(
        app.id,
        rawRows,
      );
      expect(toInsertCount).toBe(1);
      expect(insertedCount).toBe(0);
      expect(failedCount).toBe(1);
      expect(failedErrors.length).toBeGreaterThan(0);

      const errors = failedErrors.find(
        (
          each: Record<
            string,
            Array<{
              property: string;
              constraints: Record<string, string>;
            }>
          >,
        ) => Object.keys(each).find((key) => key.includes('test@example.com/title')),
      );
      const amountError = errors['test@example.com/title'];
      expect(amountError[0].property).toBe('amount');
      expect(amountError[0].constraints.isNumberString).not.toBeUndefined();
    });

    it('Should insert coinLog', async () => {
      const rawRows = [
        headerRow,
        {
          信箱: 'test@example.com',
          項目: 'title',
          代幣數量: '100',
          代幣開始時間: '',
          代幣結束時間: '',
          備註: '',
          描述: '',
          領取時間: '',
          建立時間: '',
        },
      ];

      const insertResult = await service.processImportFromFile(app.id, rawRows);
      expect(insertResult.toInsertCount).toBe(1);
      expect(insertResult.insertedCount).toBe(1);
      expect(insertResult.failedCount).toBe(0);
      expect(insertResult.failedErrors.length).toBe(0);

      for (const eachRow of rawRows) {
        const coinLog = await coinLogRepo.findOne({
          where: { member: { email: eachRow.信箱 } },
          relations: { member: true },
        });

        expect(coinLog).not.toBeUndefined();
        expect(coinLog.title).toBe('title');
        expect(coinLog.amount).toBe('100');
      }
    });
  });
});
