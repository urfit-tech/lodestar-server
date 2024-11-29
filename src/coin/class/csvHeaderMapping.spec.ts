import { ValidationError } from 'class-validator';
import { CoinCsvHeaderMapping } from './csvHeaderMapping';

describe('Class CsvHeaderMapping', () => {
  describe('Method deserializeFromRaw', () => {
    describe('Should raise error with invalid datas', () => {
      function testField(
        testFieldName: string,
        toSet: (key: string, value: Record<string, string>) => void,
        toExpect: (error: ValidationError | undefined) => void,
        fullMatch = true,
      ) {
        const header = {
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

        const readableHeaderNames = Object.entries(header)
          .filter(([_, codeHeaderName]) =>
            fullMatch ? codeHeaderName === testFieldName : codeHeaderName.includes(testFieldName),
          )
          .map(([readableHeaderName]) => readableHeaderName);

        for (let i = 0; i < readableHeaderNames.length; i++) {
          toSet(readableHeaderNames[i], header);
        }

        const [_, errors]: [CoinCsvHeaderMapping, Array<ValidationError>] =
          new CoinCsvHeaderMapping().deserializeFromRaw(header);
        const error = errors.find(({ property }) =>
          fullMatch ? property === testFieldName : property.includes(testFieldName),
        );
        toExpect(error);
      }

      const setUndefined = (key: string, value: Record<string, string>) => delete value[key];
      const setBlank = (key: string, value: Record<string, string>) => (value[key] = '');
      const expectUndefined = (error: ValidationError | undefined) => expect(error).toBeUndefined();

      it('Missing email field', async () => {
        return testField('email', setUndefined, ({ constraints }: ValidationError) => {
          expect(constraints.isString).not.toBeUndefined();
          expect(constraints.isNotEmpty).not.toBeUndefined();
        });
      });

      it('Missing title field', async () => {
        return testField('title', setUndefined, ({ constraints }: ValidationError) => {
          expect(constraints.isString).not.toBeUndefined();
          expect(constraints.isNotEmpty).not.toBeUndefined();
        });
      });

      it('Missing amount field', async () => {
        return testField('amount', setUndefined, ({ constraints }: ValidationError) => {
          expect(constraints.isString).not.toBeUndefined();
          expect(constraints.isNotEmpty).not.toBeUndefined();
        });
      });

      it('Optional note field', async () => {
        testField('note', setUndefined, expectUndefined);
        testField('note', setBlank, expectUndefined);
      });

      it('Optional description field', async () => {
        testField('description', setUndefined, expectUndefined);
        testField('description', setBlank, expectUndefined);
      });

      it('Optional startedAt field', async () => {
        testField('startedAt', setUndefined, expectUndefined);
        testField('startedAt', setBlank, expectUndefined);
      });

      it('Optional endedAt field', async () => {
        testField('endedAt', setUndefined, expectUndefined);
        testField('endedAt', setBlank, expectUndefined);
      });

      it('Optional claimedAt field', async () => {
        testField('claimedAt', setUndefined, expectUndefined);
        testField('claimedAt', setBlank, expectUndefined);
      });

      it('Optional createdAt field', async () => {
        testField('createdAt', setUndefined, expectUndefined);
        testField('createdAt', setBlank, expectUndefined);
      });
    });
  });
});
