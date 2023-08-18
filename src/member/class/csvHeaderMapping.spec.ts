import { ValidationError } from 'class-validator';

import { MemberCsvHeaderMapping } from './csvHeaderMapping';

describe('Class CsvHeaderMapping', () => {
  describe('Method deserializeFromRaw', () => {
    describe('Should raise error with invalid datas', () => {
      function testField(testFieldName: string, toSet: Function, toExpect: Function, fullMatch = true) {
        const header = {
          流水號: 'id',
          姓名: 'name',
          帳號: 'username',
          信箱: 'email',
          身份: 'role',
          手機1: 'phones.0',
          手機2: 'phones.1',
          分類1: 'categories.0',
          分類2: 'categories.1',
          屬性1: 'properties.0',
          屬性2: 'properties.1',
          標籤1: 'tags.0',
          標籤2: 'tags.1',
          星等: 'star',
          建立日期: 'createdAt',
          上次登入日期: 'loginedAt',
        };
        const readableHeaderNames = Object.entries(header)
          .filter(([_, codeHeaderName]) =>
            fullMatch ? codeHeaderName === testFieldName : codeHeaderName.includes(testFieldName),
          )
          .map(([readableHeaderName]) => readableHeaderName);
        for (let i = 0; i < readableHeaderNames.length; i++) {
          toSet(readableHeaderNames[i], header);
        }

        const [_, errors]: [MemberCsvHeaderMapping, Array<ValidationError>] =
          new MemberCsvHeaderMapping().deserializeFromRaw(header);
        const error = errors.find(({ property }) =>
          fullMatch ? property === testFieldName : property.includes(testFieldName),
        );
        toExpect(error);
      }
      const setUndefined = (key: string, value: Record<string, string>) => delete value[key];
      const setBlank = (key: string, value: Record<string, string>) => (value[key] = '');
      const expectUndefined = (error: ValidationError | undefined) => expect(error).toBeUndefined();

      it('Missing id field', async () =>
        testField('id', setUndefined, ({ constraints }: { constraints: Record<string, string> }) => {
          expect(constraints.isString).not.toBeUndefined();
          expect(constraints.isNotEmpty).not.toBeUndefined();
        }));

      it('Optional name field', async () => {
        testField('name', setUndefined, expectUndefined);
        testField('name', setBlank, expectUndefined);
      });

      it('Optional username field', async () => {
        testField('username', setUndefined, expectUndefined);
        testField('username', setBlank, expectUndefined);
      });

      it('Optional email field', async () => {
        testField('email', setUndefined, expectUndefined);
        testField('email', setBlank, expectUndefined);
      });

      it('Optional role field', async () => {
        testField('role', setUndefined, expectUndefined);
        testField('role', setBlank, expectUndefined);
      });

      it('Optional categories field', async () => {
        testField('categories', setUndefined, expectUndefined, false);
        testField('categories', setBlank, expectUndefined, false);
      });

      it('Optional properties field', async () => {
        testField('properties', setUndefined, expectUndefined, false);
        testField('properties', setBlank, expectUndefined, false);
      });

      it('Optional phones field', async () => {
        testField('phones', setUndefined, expectUndefined, false);
        testField('phones', setBlank, expectUndefined, false);
      });

      it('Optional tags field', async () => {
        testField('tags', setUndefined, expectUndefined, false);
        testField('tags', setBlank, expectUndefined, false);
      });

      it('Optional star field', async () => {
        testField('star', setUndefined, expectUndefined);
        testField('star', setBlank, expectUndefined);
      });

      it('Optional createdAt field', async () => {
        testField('createdAt', setUndefined, expectUndefined);
        testField('createdAt', setBlank, expectUndefined);
      });

      it('Optional loginedAt field', async () => {
        testField('loginedAt', setUndefined, expectUndefined);
        testField('loginedAt', setBlank, expectUndefined);
      });
    });
  });
});
