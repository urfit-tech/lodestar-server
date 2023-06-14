import { v4 } from 'uuid';
import { ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { CsvRawMember } from './csvRawMember';
import { MemberCsvHeaderMapping } from './csvHeaderMapping';

describe('Class CsvRawMember', () => {
  describe('Method deserializedFromCsvRawRow', () => {
    const header: MemberCsvHeaderMapping = plainToInstance(
      MemberCsvHeaderMapping,
      {
        id: '流水號',
        name: '姓名',
        username: '帳號',
        email: '信箱',
        role: '身份' ,
        phones: ['手機1', '手機2'],
        categories: ['分類1', '分類2'],
        properties: ['屬性1', '屬性2'],
        tags: ['標籤1', '標籤2'],
        star: '星等',
        createdAt: '建立日期',
        loginedAt: '上次登入日期',
      },
    );

    describe('Should raise error with invalid datas', () => {
      it('Missing username field', () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember()
          .deserializedFromCsvRawRow(
            header,
            {
              '流水號': id,
              '姓名': 'test',
              '信箱': 'test_email@test.com',
              '身份': 'general-member',
              '手機1': '0912345678',
              '手機2': '0923456789',
              '分類1': 'test_category1',
              '分類2': 'test_category2',
              '屬性1': 'test_value1',
              '屬性2': 'test_value2',
              '標籤1': 'test_tag1',
              '標籤2': 'test_tag2',
              '星等': '999',
              '建立日期': new Date().toISOString(),
              '上次登入日期': '',
            },
          );
        expect(errors.length).toBeGreaterThan(0);
        const { constraints } = errors.find(({ target, property }) => 
          (target as CsvRawMember).id === id && property === 'username');
        expect(constraints.isNotEmpty).not.toBeUndefined();
        expect(constraints.isString).not.toBeUndefined();
      });
      
      it('Missing email field', () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember()
          .deserializedFromCsvRawRow(
            header,
            {
              '流水號': id,
              '姓名': 'test',
              '帳號': 'test_account',
              '身份': 'general-member',
              '手機1': '0912345678',
              '手機2': '0923456789',
              '分類1': 'test_category1',
              '分類2': 'test_category2',
              '屬性1': 'test_value1',
              '屬性2': 'test_value2',
              '標籤1': 'test_tag1',
              '標籤2': 'test_tag2',
              '星等': '999',
              '建立日期': new Date().toISOString(),
              '上次登入日期': '',
            },
          );
        expect(errors.length).toBeGreaterThan(0);
        const { constraints } = errors.find(({ target, property }) => 
          (target as CsvRawMember).id === id && property === 'email');
        expect(constraints.isNotEmpty).not.toBeUndefined();
        expect(constraints.isEmail).not.toBeUndefined();
      });
      
      it('Incorrect format star field', () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember()
          .deserializedFromCsvRawRow(
            header,
            {
              '流水號': id,
              '姓名': 'test',
              '帳號': 'test_account',
              '信箱': 'test_email@test.com',
              '身份': 'general-member',
              '手機1': '0912345678',
              '手機2': '0923456789',
              '分類1': 'test_category1',
              '分類2': 'test_category2',
              '屬性1': 'test_value1',
              '屬性2': 'test_value2',
              '標籤1': 'test_tag1',
              '標籤2': 'test_tag2',
              '星等': 'some-wrong-format-of-star',
              '建立日期': new Date().toISOString(),
              '上次登入日期': '',
            },
          );
        expect(errors.length).toBeGreaterThan(0);
        const { constraints } = errors.find(({ target, property }) => 
          (target as CsvRawMember).id === id && property === 'star');
        expect(constraints.isNumber).not.toBeUndefined();
      });
    });
  });
});
