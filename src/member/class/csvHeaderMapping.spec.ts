import { ValidationError } from 'class-validator';

import { MemberCsvHeaderMapping } from './csvHeaderMapping';

describe('Class CsvHeaderMapping', () => {
  describe('Method deserializeFromRaw', () => {
    describe('Should raise error with invalid datas', () => {
      function testField(
        testFieldName: string,
        toSet: Function,
        toExpect: Function,
        fullMatch = true,
      ) {
        const header = {
          '流水號': 'id',
          '姓名': 'name',
          '帳號': 'username',
          '信箱': 'email',
          '身份': 'role',
          '手機1': 'phones.0',
          '手機2': 'phones.1',
          '分類1': 'categories.0',
          '分類2': 'categories.1',
          '屬性1': 'properties.0',
          '屬性2': 'properties.1',
          '標籤1': 'tags.0',
          '標籤2': 'tags.1',
          '星等': 'star',
          '建立日期': 'createdAt',
          '上次登入日期': 'loginedAt',
        };
        const readableHeaderNames = Object
          .entries(header)
          .filter(([_, codeHeaderName]) => fullMatch
            ? codeHeaderName === testFieldName
            : codeHeaderName.includes(testFieldName)
          )
          .map(([readableHeaderName]) => readableHeaderName);
        for (let i = 0; i < readableHeaderNames.length; i++) {
          toSet(readableHeaderNames[i], header);
        }

        const [_, errors]: [
          MemberCsvHeaderMapping, Array<ValidationError>,
        ] = new MemberCsvHeaderMapping().deserializeFromRaw(header);

        expect(errors.length).toBeGreaterThan(0);
        const { constraints } = errors.find(({ property }) => fullMatch
          ? property === testFieldName
          : property.includes(testFieldName)
        );
        toExpect(constraints);
      }

      it('Missing id field', async () => testField(
        'id',
        (key: string, value: Record<string, string>) => delete value[key],
        (constraints: Record<string, string>) => {
          expect(constraints.isString).not.toBeUndefined();
          expect(constraints.isNotEmpty).not.toBeUndefined();
        },
      ));

      it('Invalid name field', async () => {
        testField(
          'name',
          (key: string, value: Record<string, string>) => value[key] = '',
          (constraints: Record<string, string>) => {
            expect(constraints.isString).not.toBeUndefined();
            expect(constraints.isNotEmpty).not.toBeUndefined();
          },
        );
      });

      it('Invalid username field', async () => {
        testField(
          'username',
          (key: string, value: Record<string, string>) => value[key] = '',
          (constraints: Record<string, string>) => {
            expect(constraints.isString).not.toBeUndefined();
            expect(constraints.isNotEmpty).not.toBeUndefined();
          },
        );
      });

      it('Invalid email field', async () => {
        testField(
          'email',
          (key: string, value: Record<string, string>) => value[key] = '',
          (constraints: Record<string, string>) => {
            expect(constraints.isString).not.toBeUndefined();
            expect(constraints.isNotEmpty).not.toBeUndefined();
          },
        );
      });

      it('Invalid role field', async () => {
        testField(
          'role',
          (key: string, value: Record<string, string>) => value[key] = '',
          (constraints: Record<string, string>) => {
            expect(constraints.isString).not.toBeUndefined();
            expect(constraints.isNotEmpty).not.toBeUndefined();
          },
        );
      });

      it('Invalid categories field', async () => {
        testField(
          'categories',
          (key: string, value: Record<string, string>) => value[key] = '',
          (constraints: Record<string, string>) => {
            expect(constraints.isString).not.toBeUndefined();
            expect(constraints.isNotEmpty).not.toBeUndefined();
          },
          false,
        );
      });

      it('Invalid properties field', async () => {
        testField(
          'properties',
          (key: string, value: Record<string, string>) => value[key] = '',
          (constraints: Record<string, string>) => {
            expect(constraints.isString).not.toBeUndefined();
            expect(constraints.isNotEmpty).not.toBeUndefined();
          },
          false,
        );
      });

      it('Invalid phones field', async () => {
        testField(
          'phones',
          (key: string, value: Record<string, string>) => value[key] = '',
          (constraints: Record<string, string>) => {
            expect(constraints.isString).not.toBeUndefined();
            expect(constraints.isNotEmpty).not.toBeUndefined();
          },
          false,
        );
      });

      it('Invalid tags field', async () => {
        testField(
          'tags',
          (key: string, value: Record<string, string>) => value[key] = '',
          (constraints: Record<string, string>) => {
            expect(constraints.isString).not.toBeUndefined();
            expect(constraints.isNotEmpty).not.toBeUndefined();
          },
          false,
        );
      });

      it('Invalid star field', async () => {
        testField(
          'star',
          (key: string, value: Record<string, string>) => value[key] = '',
          (constraints: Record<string, string>) => {
            expect(constraints.isString).not.toBeUndefined();
            expect(constraints.isNotEmpty).not.toBeUndefined();
          },
        );
      });

      it('Invalid createdAt field', async () => {
        testField(
          'createdAt',
          (key: string, value: Record<string, string>) => value[key] = '',
          (constraints: Record<string, string>) => {
            expect(constraints.isString).not.toBeUndefined();
            expect(constraints.isNotEmpty).not.toBeUndefined();
          },
        );
      });

      it('Invalid loginedAt field', async () => {
        testField(
          'loginedAt',
          (key: string, value: Record<string, string>) => value[key] = '',
          (constraints: Record<string, string>) => {
            expect(constraints.isString).not.toBeUndefined();
            expect(constraints.isNotEmpty).not.toBeUndefined();
          },
        );
      });
    });
  });
});
