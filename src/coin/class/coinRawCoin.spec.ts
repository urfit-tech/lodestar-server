import { plainToInstance } from 'class-transformer';
import { ValidationError } from 'class-validator';
import { CoinCsvHeaderMapping } from './csvHeaderMapping';
import { CsvRawCoin } from './csvRawCoin';

describe('Class CsvRawMember', () => {
  describe('Method deserializedFromCsvRawRow', () => {
    const header: CoinCsvHeaderMapping = plainToInstance(CoinCsvHeaderMapping, {
      email: '信箱',
      title: '項目',
      amount: '代幣數量',
      note: '備註',
      description: '描述',
      startedAt: '代幣開始時間',
      endedAt: '代幣結束時間',
      claimedAt: '代幣開始時間',
      createdAt: '建立時間',
    });

    describe('Should deserialize successfully', () => {
      it('Normal insert not exists one', async () => {
        const [_, errors]: [CsvRawCoin, Array<ValidationError>] = new CsvRawCoin().deserializedFromCsvRawRow(header, {
          信箱: 'test@example.com',
          項目: 'title',
          代幣數量: '100',
          備註: 'test_note',
          描述: 'test_description',
          代幣開始時間: new Date().toISOString(),
          代幣結束時間: new Date().toISOString(),
          領取時間: new Date().toISOString(),
          建立時間: new Date().toISOString(),
        });
        expect(errors.length).toBe(0);
      });

      it('Normal insert not exists one w/ optional note field', async () => {
        const [_, errors]: [CsvRawCoin, Array<ValidationError>] = new CsvRawCoin().deserializedFromCsvRawRow(header, {
          信箱: 'test@example.com',
          項目: 'title',
          代幣數量: '100',
          備註: '',
          描述: 'test_description',
          代幣開始時間: new Date().toISOString(),
          代幣結束時間: new Date().toISOString(),
          領取時間: new Date().toISOString(),
          建立時間: new Date().toISOString(),
        });
        expect(errors.length).toBe(0);
      });
    });

    describe('Should raise error with invalid datas', () => {
      it('Missing require email field when insert not exists one', async () => {
        const [_, errors]: [CsvRawCoin, Array<ValidationError>] = new CsvRawCoin().deserializedFromCsvRawRow(header, {
          信箱: '',
          項目: 'title',
          代幣數量: '100',
          備註: 'test_note',
          描述: 'test_description',
          代幣開始時間: new Date().toISOString(),
          代幣結束時間: new Date().toISOString(),
          領取時間: new Date().toISOString(),
          建立時間: new Date().toISOString(),
        });
        expect(errors.length).toBe(1);
        const { property, constraints } = errors.find(({ property }) => property === 'email');
        expect(property).toBe('email');
        expect(constraints.isNotEmpty).not.toBeUndefined();
        expect(constraints.isEmail).not.toBeUndefined();
      });
    });
  });
});
