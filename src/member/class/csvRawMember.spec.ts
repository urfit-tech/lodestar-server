import { v4 } from 'uuid';
import { ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { CsvRawMember } from './csvRawMember';
import { MemberCsvHeaderMapping } from './csvHeaderMapping';

describe('Class CsvRawMember', () => {
  describe('Method deserializedFromCsvRawRow', () => {
    const header: MemberCsvHeaderMapping = plainToInstance(MemberCsvHeaderMapping, {
      id: '流水號',
      name: '姓名',
      username: '帳號',
      email: '信箱',
      role: '身份',
      phones: ['手機1', '手機2'],
      categories: ['分類1', '分類2'],
      properties: ['屬性1', '屬性2'],
      tags: ['標籤1', '標籤2'],
      star: '星等',
      createdAt: '建立日期',
      loginedAt: '上次登入日期',
    });

    describe('Should deserialize successfully', () => {
      it('Normal insert not exists one', async () => {
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: '',
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal insert not exists one w/ duplicate phone numbers', async () => {
        const [member, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: '',
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0912345678',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(member.phones.length).toBe(1);
        expect(errors.length).toBe(0);
      });

      it('Normal insert not exists one w/ optional name field', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: '',
            姓名: '',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal insert not exists one w/ optional role field', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: '',
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: '',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal insert not exists one w/ optional createdAt field', async () => {
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: '',
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: '',
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal insert not exists one w/ optional loginedAt field', async () => {
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: '',
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: '',
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal insert not exists one w/ optional phones field', async () => {
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: '',
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '',
            手機2: '',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal insert not exists one w/ optional categories field', async () => {
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: '',
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: '',
            分類2: '',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal insert not exists one w/ optional properties field', async () => {
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: '',
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: '',
            屬性2: '',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal insert not exists one w/ optional tags field', async () => {
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: '',
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: '',
            標籤2: '',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal update exists one', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: id,
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal update exists one w/ optional name field', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: id,
            姓名: '',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal update exists one w/ optional username field', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: id,
            姓名: 'test',
            帳號: '',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal update exists one w/ optional email field', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: id,
            姓名: 'test',
            帳號: 'test_account',
            信箱: '',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal update exists one w/ optional role field', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: id,
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: '',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal update exists one w/ optional phones field', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: id,
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '',
            手機2: '',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal update exists one w/ optional categories field', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: id,
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: '',
            分類2: '',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal update exists one w/ optional properties field', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: id,
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: '',
            屬性2: '',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal update exists one w/ optional tags field', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: id,
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: '',
            標籤2: '',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal update exists one w/ optional star field', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: id,
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal update exists one w/ optional createdAt field', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: id,
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: '',
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(0);
      });

      it('Normal update exists one w/ optional loginedAt field', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: id,
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: '',
          },
        );
        expect(errors.length).toBe(0);
      });
    });

    describe('Should raise error with invalid datas', () => {
      it('Missing require username field when insert not exists one', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: '',
            姓名: 'test',
            帳號: '',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(1);
        const { property, constraints } = errors.find(({ property }) => property === 'username');
        expect(property).toBe('username');
        expect(constraints.isNotEmpty).not.toBeUndefined();
        expect(constraints.isString).not.toBeUndefined();
      });

      it('Missing require email field when insert not exists one', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: '',
            姓名: 'test',
            帳號: 'test_account',
            信箱: '',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(1);
        const { property, constraints } = errors.find(({ property }) => property === 'email');
        expect(property).toBe('email');
        expect(constraints.isNotEmpty).not.toBeUndefined();
        expect(constraints.isEmail).not.toBeUndefined();
      });

      it('Missing require star field when insert not exists one', async () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: '',
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@example.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '',
            建立日期: new Date().toISOString(),
            上次登入日期: new Date().toISOString(),
          },
        );
        expect(errors.length).toBe(1);
        const { property, constraints } = errors.find(({ property }) => property === 'star');
        expect(property).toBe('star');
        expect(constraints.isNotEmpty).not.toBeUndefined();
        expect(constraints.isNumberString).not.toBeUndefined();
      });

      it('Incorrect format email field', () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: id,
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'some-wrong-format-of-email',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: '',
          },
        );
        expect(errors.length).toBeGreaterThan(0);
        const { constraints } = errors.find(
          ({ target, property }) => (target as CsvRawMember).id === id && property === 'email',
        );
        expect(constraints.isEmail).not.toBeUndefined();
      });

      it('Incorrect format star field', () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: id,
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@test.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: 'some-wrong-format-of-star',
            建立日期: new Date().toISOString(),
            上次登入日期: '',
          },
        );
        expect(errors.length).toBeGreaterThan(0);
        const { constraints } = errors.find(
          ({ target, property }) => (target as CsvRawMember).id === id && property === 'star',
        );
        expect(constraints.isNumberString).not.toBeUndefined();
      });

      it('Incorrect format createdAt field', () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: id,
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@test.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: 'some-wrong-format-of-created-at',
            上次登入日期: '',
          },
        );
        expect(errors.length).toBeGreaterThan(0);
        const { constraints } = errors.find(
          ({ target, property }) => (target as CsvRawMember).id === id && property === 'createdAt',
        );
        expect(constraints.isDateString).not.toBeUndefined();
      });

      it('Incorrect format loginedAt field', () => {
        const id = v4();
        const [_, errors]: [CsvRawMember, Array<ValidationError>] = new CsvRawMember().deserializedFromCsvRawRow(
          header,
          {
            流水號: id,
            姓名: 'test',
            帳號: 'test_account',
            信箱: 'test_email@test.com',
            身份: 'general-member',
            手機1: '0912345678',
            手機2: '0923456789',
            分類1: 'test_category1',
            分類2: 'test_category2',
            屬性1: 'test_value1',
            屬性2: 'test_value2',
            標籤1: 'test_tag1',
            標籤2: 'test_tag2',
            星等: '99',
            建立日期: new Date().toISOString(),
            上次登入日期: 'some-wrong-format-of-logined-at',
          },
        );
        expect(errors.length).toBeGreaterThan(0);
        const { constraints } = errors.find(
          ({ target, property }) => (target as CsvRawMember).id === id && property === 'loginedAt',
        );
        expect(constraints.isDateString).not.toBeUndefined();
      });
    });
  });
});
