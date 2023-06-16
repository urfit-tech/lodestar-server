import { v4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';

import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { Property } from '~/definition/entity/property.entity';
import { Category } from '~/definition/entity/category.entity';
import { Tag } from '~/definition/entity/tag.entity';

import { MemberService } from './member.service';
import { MemberInfrastructure } from './member.infra';
import { Member } from './entity/member.entity';
import { MemberPhone } from './entity/member_phone.entity';
import { MemberProperty } from './entity/member_property.entity';
import { MemberCategory } from './entity/member_category.entity';
import { MemberTag } from './entity/member_tag.entity';
import { MemberCsvHeaderMapping } from './class/csvHeaderMapping';

describe('MemberService', () => {
  let service: MemberService;
  let mockDefinitionInfra = {
    getCategories: jest.fn(),
    getProperties: jest.fn(),
    getTags: jest.fn(),
  };
  let mockMemberInfra = {
    getMembersByConditions: jest.fn(),
  };
  let mockEntityManager = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        {
          provide: DefinitionInfrastructure,
          useValue: mockDefinitionInfra,
        },
        {
          provide: MemberInfrastructure,
          useValue: mockMemberInfra,
        },
        {
          provide: getEntityManagerToken('phdb'),
          useValue: mockEntityManager,
          
        }
      ],
    }).compile();

    service = module.get<MemberService>(MemberService);
  });

  afterEach(() => jest.resetAllMocks());

  describe('#rawCsvToMember', () => {
    it('Should process all included categories, properties, tags, phones', async () => {
      const memberId = v4();
      const createdAt = new Date();
      const rawRows = [
        {
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
        },
        {
          '流水號': memberId,
          '姓名': 'test',
          '帳號': 'test_account',
          '信箱': 'test_email@test.com',
          '身份': 'general-member',
          '手機1': '0912345678',
          '手機2': '0923456789',
          '分類1': 'test_category1',
          '分類2': 'test_category2',
          '屬性1': 'test_property1',
          '屬性2': 'test_property2',
          '標籤1': 'test_tag1',
          '標籤2': 'test_tag2',
          '星等': '999',
          '建立日期': createdAt.toISOString(),
          '上次登入日期': '',
        },
      ];
      mockMemberInfra.getMembersByConditions.mockReturnValueOnce([]);
      mockDefinitionInfra.getCategories.mockReturnValueOnce([
        { id: 'test_category1_id', name: 'test_category1' },
        { id: 'test_category2_id', name: 'test_category2' },
      ]);
      mockDefinitionInfra.getProperties.mockReturnValueOnce([
        { id: 'test_property1_id', name: '屬性1' },
        { id: 'test_property2_id', name: '屬性2' },
      ])
      mockDefinitionInfra.getTags.mockReturnValueOnce([
        { name: 'test_tag1' },
        { name: 'test_tag2' },
      ]);
      
      const [headerInfos, _] = new MemberCsvHeaderMapping().deserializeFromRaw(rawRows.shift());
      const [member] = await service.rawCsvToMember('test-app-id', headerInfos, rawRows);
      expect(member.id).toBe(memberId);
      expect(member.name).toBe('test');
      expect(member.username).toBe('test_account');
      expect(member.email).toBe('test_email@test.com');
      member.memberPhones.forEach((memberPhone) => {
        expect(['0912345678', '0923456789']).toContain(memberPhone.phone);
      });
      member.memberCategories.forEach((memberCategory) => {
        expect(['test_category1_id', 'test_category2_id']).toContain(memberCategory.category.id);
      });
      member.memberProperties.forEach((memberProperty) => {
        if (memberProperty.property.id === 'test_property1_id') {
          expect(memberProperty.value).toEqual('test_property1');
        } else {
          expect(memberProperty.value).toEqual('test_property2');
        }
      });
      member.memberTags.forEach((memberTag) => {
        expect(['test_tag1', 'test_tag2']).toContain(memberTag.tagName2.name);
      });
      expect(member.star).toBe(999);
      expect(member.createdAt).toStrictEqual(createdAt);
      expect(member.loginedAt).toBeNull();
    });

    it('Should allow missing partial categories, properties, tags, phones', async () => {
      const memberId = v4();
      const createdAt = new Date();
      const rawRows = [
        {
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
        },
        {
          '流水號': memberId,
          '姓名': 'test_partial_missing',
          '帳號': 'test_partial_missing_account',
          '信箱': 'test_partial_missing_email@test.com',
          '身份': 'general-member',
          '手機1': '0912345678',
          '手機2': '',
          '分類1': 'test_category1',
          '分類2': '',
          '屬性1': 'test_property1',
          '屬性2': '',
          '標籤1': 'test_tag1',
          '標籤2': '',
          '星等': '999',
          '建立日期': createdAt.toISOString(),
          '上次登入日期': '',
        },
      ];
      mockMemberInfra.getMembersByConditions.mockReturnValueOnce([]);
      mockDefinitionInfra.getCategories.mockReturnValueOnce([
        { id: 'test_category1_id', name: 'test_category1' },
        { id: 'test_category2_id', name: 'test_category2' },
      ]);
      mockDefinitionInfra.getProperties.mockReturnValueOnce([
        { id: 'test_property1_id', name: '屬性1' },
        { id: 'test_property2_id', name: '屬性2' },
      ])
      mockDefinitionInfra.getTags.mockReturnValueOnce([
        { name: 'test_tag1' },
        { name: 'test_tag2' },
      ]);

      const [headerInfos, _] = new MemberCsvHeaderMapping().deserializeFromRaw(rawRows.shift());
      const [member] = await service.rawCsvToMember('test-app-id', headerInfos, rawRows);
      expect(member.id).toBe(memberId);
      expect(member.name).toBe('test_partial_missing');
      expect(member.username).toBe('test_partial_missing_account');
      expect(member.email).toBe('test_partial_missing_email@test.com');
      expect(member.memberPhones.length).toBe(1);
      expect(member.memberPhones[0].phone).toEqual('0912345678');
      expect(member.memberCategories.length).toBe(1);
      expect(member.memberCategories[0].category.id).toEqual('test_category1_id');
      expect(member.memberProperties.length).toBe(1);
      expect(member.memberProperties[0].property.id).toEqual('test_property1_id');
      expect(member.memberProperties[0].value).toEqual('test_property1');
      expect(member.memberTags.length).toBe(1);
      expect(member.memberTags[0].tagName2.name).toEqual('test_tag1');
      expect(member.star).toBe(999);
      expect(member.createdAt).toStrictEqual(createdAt);
      expect(member.loginedAt).toBeNull();
    });

    it('Should skip unknown categories, properties, tags', async () => {
      const memberId = v4();
      const createdAt = new Date();
      const rawRows = [
        {
          '流水號': 'id',
          '姓名': 'name',
          '帳號': 'username',
          '信箱': 'email',
          '身份': 'role',
          '手機1': 'phones.0',
          '手機2': 'phones.1',
          '分類1': 'categories.0',
          '不存在分類2': 'categories.1',
          '屬性1': 'properties.0',
          '不存在屬性2': 'properties.1',
          '標籤1': 'tags.0',
          '不存在標籤2': 'tags.1',
          '星等': 'star',
          '建立日期': 'createdAt',
          '上次登入日期': 'loginedAt',
        },
        {
          '流水號': memberId,
          '姓名': 'test_not_exists',
          '帳號': 'test_not_exists_account',
          '信箱': 'test_not_exists_email@test.com',
          '身份': 'general-member',
          '手機1': '0912345678',
          '手機2': '',
          '分類1': 'test_category1',
          '不存在分類2': 'not_exists_category',
          '屬性1': 'test_property1',
          '不存在屬性2': 'not_exists_property',
          '標籤1': 'test_tag1',
          '不存在標籤2': 'not_exists_tag',
          '星等': '999',
          '建立日期': createdAt.toISOString(),
          '上次登入日期': '',
        },
      ];
      mockMemberInfra.getMembersByConditions.mockReturnValueOnce([]);
      mockDefinitionInfra.getCategories.mockReturnValueOnce([
        { id: 'test_category1_id', name: 'test_category1' },
      ]);
      mockDefinitionInfra.getProperties.mockReturnValueOnce([
        { id: 'test_property1_id', name: '屬性1' },
      ])
      mockDefinitionInfra.getTags.mockReturnValueOnce([
        { name: 'test_tag1' },
      ]);

      const [headerInfos, _] = new MemberCsvHeaderMapping().deserializeFromRaw(rawRows.shift());
      const [member] = await service.rawCsvToMember('test-app-id', headerInfos, rawRows);
      expect(member.id).toBe(memberId);
      expect(member.name).toBe('test_not_exists');
      expect(member.username).toBe('test_not_exists_account');
      expect(member.email).toBe('test_not_exists_email@test.com');
      expect(member.memberPhones.length).toBe(1);
      expect(member.memberPhones[0].phone).toEqual('0912345678');
      expect(member.memberCategories.length).toBe(1);
      expect(member.memberCategories[0].category.id).toEqual('test_category1_id');
      expect(member.memberProperties.length).toBe(1);
      expect(member.memberProperties[0].property.id).toEqual('test_property1_id');
      expect(member.memberProperties[0].value).toEqual('test_property1');
      expect(member.memberTags.length).toBe(1);
      expect(member.memberTags[0].tagName2.name).toEqual('test_tag1');
      expect(member.star).toBe(999);
      expect(member.createdAt).toStrictEqual(createdAt);
      expect(member.loginedAt).toBeNull();
    });

    it('Should skip extra unknown categories, properties, tags', async () => {
      const memberId = v4();
      const createdAt = new Date();
      const rawRows = [
        {
          '流水號': 'id',
          '姓名': 'name',
          '帳號': 'username',
          '信箱': 'email',
          '身份': 'role',
          '手機1': 'phones.0',
          '手機2': 'phones.1',
          '分類1': 'categories.0',
          '屬性1': 'properties.0',
          '標籤1': 'tags.0',
          '星等': 'star',
          '建立日期': 'createdAt',
          '上次登入日期': 'loginedAt',
        },
        {
          '流水號': memberId,
          '姓名': 'test_extra_unknown',
          '帳號': 'test_extra_unknown_account',
          '信箱': 'test_extra_unknown_email@test.com',
          '身份': 'general-member',
          '手機1': '0912345678',
          '手機2': '',
          '分類1': 'test_category1',
          '多餘分類1': 'extra_unknown_category',
          '屬性1': 'test_property1',
          '多餘屬性2': 'extra_unknown_property',
          '標籤1': 'test_tag1',
          '多餘標籤2': 'extra_unknown_tag',
          '星等': '999',
          '建立日期': createdAt.toISOString(),
          '上次登入日期': '',
        },
      ];
      mockMemberInfra.getMembersByConditions.mockReturnValueOnce([]);
      mockDefinitionInfra.getCategories.mockReturnValueOnce([
        { id: 'test_category1_id', name: 'test_category1' },
      ]);
      mockDefinitionInfra.getProperties.mockReturnValueOnce([
        { id: 'test_property1_id', name: '屬性1' },
      ])
      mockDefinitionInfra.getTags.mockReturnValueOnce([
        { name: 'test_tag1' },
      ]);

      const [headerInfos, _] = new MemberCsvHeaderMapping().deserializeFromRaw(rawRows.shift());
      const [member] = await service.rawCsvToMember('test-app-id', headerInfos, rawRows);
      expect(member.id).toBe(memberId);
      expect(member.name).toBe('test_extra_unknown');
      expect(member.username).toBe('test_extra_unknown_account');
      expect(member.email).toBe('test_extra_unknown_email@test.com');
      expect(member.memberPhones.length).toBe(1);
      expect(member.memberPhones[0].phone).toEqual('0912345678');
      expect(member.memberCategories.length).toBe(1);
      expect(member.memberCategories[0].category.id).toEqual('test_category1_id');
      expect(member.memberProperties.length).toBe(1);
      expect(member.memberProperties[0].property.id).toEqual('test_property1_id');
      expect(member.memberProperties[0].value).toEqual('test_property1');
      expect(member.memberTags.length).toBe(1);
      expect(member.memberTags[0].tagName2.name).toEqual('test_tag1');
      expect(member.star).toBe(999);
      expect(member.createdAt).toStrictEqual(createdAt);
      expect(member.loginedAt).toBeNull();
    });

    it('Should skip invalid raw rows', async () => {
      const memberId = v4();
      const invalidMemberId = v4();
      const createdAt = new Date();
      const rawRows = [
        {
          '流水號': 'id',
          '姓名': 'name',
          '帳號': 'username',
          '信箱': 'email',
          '身份': 'role',
          '手機1': 'phones.0',
          '分類1': 'categories.0',
          '屬性1': 'properties.0',
          '標籤1': 'tags.0',
          '星等': 'star',
          '建立日期': 'createdAt',
          '上次登入日期': 'loginedAt',
        },
        {
          '流水號': memberId,
          '姓名': 'test_normal',
          '帳號': 'test_normal_account',
          '信箱': 'test_normal_email@test.com',
          '身份': 'general-member',
          '手機1': '0912345678',
          '分類1': 'test_category1',
          '屬性1': 'test_property1',
          '標籤1': 'test_tag1',
          '星等': '999',
          '建立日期': createdAt.toISOString(),
          '上次登入日期': '',
        },
        {
          '流水號': invalidMemberId,
          '姓名': 'test_invalid_email',
          '帳號': 'test_invalid_email_account',
          '信箱': '',
          '身份': 'general-member',
          '手機1': '0912345678',
          '分類1': 'test_category1',
          '屬性1': 'test_property1',
          '標籤1': 'test_tag1',
          '星等': '999',
          '建立日期': createdAt.toISOString(),
          '上次登入日期': '',
        },
      ];
      mockMemberInfra.getMembersByConditions.mockReturnValueOnce([]);
      mockDefinitionInfra.getCategories.mockReturnValueOnce([
        { id: 'test_category1_id', name: 'test_category1' },
      ]);
      mockDefinitionInfra.getProperties.mockReturnValueOnce([
        { id: 'test_property1_id', name: '屬性1' },
      ])
      mockDefinitionInfra.getTags.mockReturnValueOnce([
        { name: 'test_tag1' },
      ]);

      const [headerInfos, _] = new MemberCsvHeaderMapping().deserializeFromRaw(rawRows.shift());
      const deserializeResults = await service.rawCsvToMember('test-app-id', headerInfos, rawRows);
      const errorResults = deserializeResults.filter(([member]) => member === null);
      const [errorResult] = errorResults;
      const [errorMember, errors] = errorResult;
      expect(errorMember).toBeNull();
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints.isNotEmpty).not.toBeUndefined();
      expect(errors[0].constraints.isEmail).not.toBeUndefined();

      const successResults = deserializeResults.filter(([member]) => member !== null);
      expect(successResults.length).toBe(1);
      const [successResult] = successResults;
      const [member, error] = successResult;
      expect(error.length).toBe(0);
      expect(member.id).toBe(memberId);
      expect(member.name).toBe('test_normal');
      expect(member.username).toBe('test_normal_account');
      expect(member.email).toBe('test_normal_email@test.com');
      expect(member.memberPhones.length).toBe(1);
      expect(member.memberPhones[0].phone).toEqual('0912345678');
      expect(member.memberCategories.length).toBe(1);
      expect(member.memberCategories[0].category.id).toEqual('test_category1_id');
      expect(member.memberProperties.length).toBe(1);
      expect(member.memberProperties[0].property.id).toEqual('test_property1_id');
      expect(member.memberProperties[0].value).toEqual('test_property1');
      expect(member.memberTags.length).toBe(1);
      expect(member.memberTags[0].tagName2.name).toEqual('test_tag1');
      expect(member.star).toBe(999);
      expect(member.createdAt).toStrictEqual(createdAt);
      expect(member.loginedAt).toBeNull();
    });
  });

  describe('#memberToRawCsv', () => {
    it('Should process all member fields and generate csv rows', async () => {
      const category1 = new Category();
      category1.id = 'test_category1_id';
      category1.name = '測試分類1';

      const property1 = new Property();
      property1.id = 'test_property1_id';
      property1.name = '測試屬性1';

      const tag1 = new Tag();
      tag1.name = '測試標籤1';

      const headerInfos = await new MemberCsvHeaderMapping()
        .deserializeFromDataBase(5, 5, [category1], [property1]);
      const member = new Member();
      member.id = v4();
      member.name = 'test';
      member.username = 'test';
      member.email = 'test@example.com';
      member.star = 999;
      member.createdAt = new Date();

      const memberPhone1 = new MemberPhone();
      memberPhone1.phone = '0912345678';
      member.memberPhones = [memberPhone1];

      const memberProperty1 = new MemberProperty();
      memberProperty1.property = property1;
      memberProperty1.value = '測試屬性值1';
      member.memberProperties = [memberProperty1];

      const memberCategory1 = new MemberCategory();
      memberCategory1.category = category1;
      member.memberCategories = [memberCategory1];

      const memberTag1 = new MemberTag();
      memberTag1.tagName2 = tag1;
      member.memberTags = [memberTag1];

      const raws = await service.memberToRawCsv(
        headerInfos,
        [member],
      );
      const [raw] = raws;
      expect(raws.length).toBe(1);
      expect(raw['流水號']).toEqual(member.id);
      expect(raw['姓名']).toEqual(member.name);
      expect(raw['帳號']).toEqual(member.username);
      expect(raw['信箱']).toEqual(member.email);
      expect(raw['身份']).toEqual(member.role);
      expect(raw['星等']).toEqual(member.star);
      expect(raw['建立日期']).toEqual(member.createdAt.toISOString());
      expect(raw['上次登入日期']).toEqual('');
      expect(raw['分類1']).toEqual(member.memberCategories[0].category.name);
      expect(raw['測試屬性1']).toEqual(member.memberProperties[0].value);
      expect(raw['手機1']).toEqual(member.memberPhones[0].phone);
      expect(raw['標籤1']).toEqual(member.memberTags[0].tagName2.name);
    });

    it('Should process all member fields and generate csv rows with multiple field values', async () => {
      const category1 = new Category();
      category1.id = 'test_category1_id';
      category1.name = '測試分類1';
      const category2 = new Category();
      category2.id = 'test_category2_id';
      category2.name = '測試分類2';

      const property1 = new Property();
      property1.id = 'test_property1_id';
      property1.name = '測試屬性1';
      const property2 = new Property();
      property2.id = 'test_property2_id';
      property2.name = '測試屬性2';

      const tag1 = new Tag();
      tag1.name = '測試標籤1';
      const tag2 = new Tag();
      tag2.name = '測試標籤2';

      const headerInfos = await new MemberCsvHeaderMapping()
        .deserializeFromDataBase(
          5,
          5,
          [category1, category2],
          [property1, property2],
        );
      const member = new Member();
      member.id = v4();
      member.name = 'test';
      member.username = 'test';
      member.email = 'test@example.com';
      member.star = 999;
      member.createdAt = new Date();

      const memberPhone1 = new MemberPhone();
      memberPhone1.phone = '0912345678';
      const memberPhone2 = new MemberPhone();
      memberPhone2.phone = '0911111111';
      member.memberPhones = [memberPhone1, memberPhone2];

      const memberProperty1 = new MemberProperty();
      memberProperty1.property = property1;
      memberProperty1.value = '測試屬性值1';
      const memberProperty2 = new MemberProperty();
      memberProperty2.property = property2;
      memberProperty2.value = '測試屬性值2';
      member.memberProperties = [memberProperty1, memberProperty2];

      const memberCategory1 = new MemberCategory();
      memberCategory1.category = category1;
      const memberCategory2 = new MemberCategory();
      memberCategory2.category = category2;
      member.memberCategories = [memberCategory1, memberCategory2];

      const memberTag1 = new MemberTag();
      memberTag1.tagName2 = tag1;
      const memberTag2 = new MemberTag();
      memberTag2.tagName2 = tag2;
      member.memberTags = [memberTag1, memberTag2];

      const raws = await service.memberToRawCsv(
        headerInfos,
        [member],
      );
      const [raw] = raws;
      expect(raws.length).toBe(1);
      expect(raw['流水號']).toEqual(member.id);
      expect(raw['姓名']).toEqual(member.name);
      expect(raw['帳號']).toEqual(member.username);
      expect(raw['信箱']).toEqual(member.email);
      expect(raw['身份']).toEqual(member.role);
      expect(raw['星等']).toEqual(member.star);
      expect(raw['建立日期']).toEqual(member.createdAt.toISOString());
      expect(raw['上次登入日期']).toEqual('');
      Array(member.memberCategories.length).forEach((index) => {
        expect(raw[`分類${index + 1}`]).toEqual(member.memberCategories[index].category.name);
        expect(raw[`測試屬性${index + 1}`]).toEqual(member.memberProperties[index].value);
        expect(raw[`標籤${index + 1}`]).toEqual(member.memberTags[index].tagName2.name);
      });
      Array(member.memberPhones.length).forEach((index) => {
        expect(raw[`手機${index + 1}`]).toEqual(member.memberPhones[index].phone);
      });
    });

    it('Should output empty string if some category, property, tag is not use', async () => {
      const category1 = new Category();
      category1.id = 'test_category1_id';
      category1.name = '測試分類1';
      const category2 = new Category();
      category2.id = 'test_category2_id';
      category2.name = '測試分類2';

      const property1 = new Property();
      property1.id = 'test_property1_id';
      property1.name = '測試屬性1';
      const property2 = new Property();
      property2.id = 'test_property2_id';
      property2.name = '測試屬性2';

      const tag1 = new Tag();
      tag1.name = '測試標籤1';
      const tag2 = new Tag();
      tag2.name = '測試標籤2';

      const headerInfos = await new MemberCsvHeaderMapping()
        .deserializeFromDataBase(
          5,
          5,
          [category1, category2],
          [property1, property2],
        );
      const member = new Member();
      member.id = v4();
      member.name = 'test';
      member.username = 'test';
      member.email = 'test@example.com';
      member.star = 999;
      member.createdAt = new Date();

      const memberPhone1 = new MemberPhone();
      memberPhone1.phone = '0912345678';
      const memberPhone2 = new MemberPhone();
      memberPhone2.phone = '0911111111';
      member.memberPhones = [memberPhone1, memberPhone2];

      const memberProperty1 = new MemberProperty();
      memberProperty1.property = property1;
      memberProperty1.value = '測試屬性值1';
      member.memberProperties = [memberProperty1];

      const memberCategory1 = new MemberCategory();
      memberCategory1.category = category1;
      member.memberCategories = [memberCategory1];

      const memberTag1 = new MemberTag();
      memberTag1.tagName2 = tag1;
      member.memberTags = [memberTag1];

      const raws = await service.memberToRawCsv(
        headerInfos,
        [member],
      );
      const [raw] = raws;
      expect(raws.length).toBe(1);
      expect(raw['流水號']).toEqual(member.id);
      expect(raw['姓名']).toEqual(member.name);
      expect(raw['帳號']).toEqual(member.username);
      expect(raw['信箱']).toEqual(member.email);
      expect(raw['星等']).toEqual(member.star);
      expect(raw['建立日期']).toEqual(member.createdAt.toISOString());
      expect(raw['上次登入日期']).toEqual('');
      Array(member.memberCategories.length).forEach((index) => {
        expect(raw[`分類${index + 1}`]).toEqual(member.memberCategories[index]
          ? member.memberCategories[index].category.name : '',
        );
        expect(raw[`測試屬性${index + 1}`]).toEqual(member.memberProperties[index]
          ? member.memberProperties[index].value : '',
        );
        expect(raw[`標籤${index + 1}`]).toEqual(member.memberTags[index]
          ? member.memberTags[index].tagName2.name : '',
        );
      });
      Array(member.memberPhones.length).forEach((index) => {
        expect(raw[`手機${index + 1}`]).toEqual(member.memberPhones[index]
          ? member.memberPhones[index].phone : '',
        );
      });
    });

    it('Should skip categories, properties, tags is not belong to app', async () => {
      const category1 = new Category();
      category1.id = 'test_category1_id';
      category1.name = '測試分類1';
      const notBelongCategory = new Category();
      notBelongCategory.id = 'notBelongCategory_id';
      notBelongCategory.name = '不存在分類';

      const property1 = new Property();
      property1.id = 'test_property1_id';
      property1.name = '測試屬性1';
      const notBelongProperty = new Property();
      notBelongProperty.id = 'notBelongProperty_id';
      notBelongProperty.name = '不存在屬性';

      const tag1 = new Tag();
      tag1.name = '測試標籤1';
      const notBelongTag = new Tag();
      notBelongTag.name = '不存在標籤';

      const headerInfos = await new MemberCsvHeaderMapping()
        .deserializeFromDataBase(5, 5, [category1], [property1]);
      const member = new Member();
      member.id = v4();
      member.name = 'test';
      member.username = 'test';
      member.email = 'test@example.com';
      member.star = 999;
      member.createdAt = new Date();

      const memberPhone1 = new MemberPhone();
      memberPhone1.phone = '0912345678';
      member.memberPhones = [memberPhone1];

      const memberProperty1 = new MemberProperty();
      memberProperty1.property = property1;
      memberProperty1.value = '測試屬性值1';
      const notBelongMemberProperty = new MemberProperty();
      notBelongMemberProperty.property = notBelongProperty;
      notBelongMemberProperty.value = '不存在屬性之值';
      member.memberProperties = [memberProperty1, notBelongMemberProperty];

      const memberCategory1 = new MemberCategory();
      memberCategory1.category = category1;
      const notBelongMemberCategory = new MemberCategory();
      notBelongMemberCategory.category = notBelongCategory;
      member.memberCategories = [memberCategory1, notBelongMemberCategory];

      const memberTag1 = new MemberTag();
      memberTag1.tagName2 = tag1;
      const notBelongMemberTag = new MemberTag();
      notBelongMemberTag.tagName2 = notBelongTag;
      member.memberTags = [memberTag1, notBelongMemberTag];

      const raws = await service.memberToRawCsv(
        headerInfos,
        [member],
      );
      const [raw] = raws;
      expect(raws.length).toBe(1);
      expect(raw['流水號']).toEqual(member.id);
      expect(raw['姓名']).toEqual(member.name);
      expect(raw['帳號']).toEqual(member.username);
      expect(raw['信箱']).toEqual(member.email);
      expect(raw['星等']).toEqual(member.star);
      expect(raw['建立日期']).toEqual(member.createdAt.toISOString());
      expect(raw['上次登入日期']).toEqual('');
      Array(member.memberCategories.length).forEach((index) => {
        expect(raw[`分類${index + 1}`]).toEqual(index === 0
          ? member.memberCategories[index].category.name : '',
        );
        expect(raw[`測試屬性${index + 1}`]).toEqual(index === 0
          ? member.memberProperties[index].value : '',
        );
        expect(raw[`標籤${index + 1}`]).toEqual(index === 0
          ? member.memberTags[index].tagName2.name : '',
        );
      });
      Array(member.memberPhones.length).forEach((index) => {
        expect(raw[`手機${index + 1}`]).toEqual(member.memberPhones[index]
          ? member.memberPhones[index].phone : '',
        );
      });
    });
  });

  describe('Complementary of import / export functionalities', () => {
    it('exported data can re-import with multiple', async () => {
      const category1 = new Category();
      category1.id = 'test_category1_id';
      category1.name = '測試分類1';

      const property1 = new Property();
      property1.id = 'test_property1_id';
      property1.name = '測試屬性1';

      const tag1 = new Tag();
      tag1.name = '測試標籤1';

      mockMemberInfra.getMembersByConditions.mockReturnValueOnce([]);
      mockDefinitionInfra.getCategories.mockReturnValueOnce([category1]);
      mockDefinitionInfra.getProperties.mockReturnValueOnce([property1]);
      mockDefinitionInfra.getTags.mockReturnValueOnce([tag1]);

      const headerInfos = await new MemberCsvHeaderMapping()
        .deserializeFromDataBase(5, 5, [category1], [property1]);
      const memberId = v4();
      const memberCreatedAt = new Date();
      const member = new Member();
      member.id = memberId;
      member.name = 'test';
      member.username = 'test';
      member.email = 'test@example.com';
      member.star = 999;
      member.createdAt = memberCreatedAt;

      const memberPhone1 = new MemberPhone();
      memberPhone1.phone = '0912345678';
      member.memberPhones = [memberPhone1];

      const memberProperty1 = new MemberProperty();
      memberProperty1.property = property1;
      memberProperty1.value = '測試屬性1之值';
      member.memberProperties = [memberProperty1];

      const memberCategory1 = new MemberCategory();
      memberCategory1.category = category1;
      member.memberCategories = [memberCategory1];

      const memberTag1 = new MemberTag();
      memberTag1.tagName2 = tag1;
      member.memberTags = [memberTag1];

      const rawRows = await service.memberToRawCsv(
        headerInfos,
        [member],
      );
      const importedMembers = await service.rawCsvToMember('test-app-id', headerInfos, rawRows);
      expect(importedMembers.length).toBe(1);
      const [importedMember] = importedMembers;
      expect(importedMember.id).toEqual(member.id);
      expect(importedMember.name).toEqual(member.name);
      expect(importedMember.username).toEqual(member.username);
      expect(importedMember.email).toEqual(member.email);
      expect(importedMember.star).toEqual(member.star);
      expect(importedMember.createdAt).toEqual(memberCreatedAt);
      expect(importedMember.loginedAt).toBeNull();
      importedMember.memberPhones.forEach((each) => {
        const find = member.memberPhones.find((every) => each.phone === every.phone);
        expect(find).not.toBeUndefined();
      });
      importedMember.memberCategories.forEach((each) => {
        const find = member.memberCategories.find((every) => each.categoryId === every.categoryId);
        expect(find).not.toBeUndefined();
      });
      importedMember.memberProperties.forEach((each) => {
        const find = member.memberProperties.find((every) => each.id === every.id);
        expect(find).not.toBeUndefined();
        expect(find.value).toEqual(memberProperty1.value);
      });
      importedMember.memberTags.forEach((each) => {
        const find = member.memberTags.find((every) => each.id === every.id);
        expect(find).not.toBeUndefined();
      });
    });

    it('imported data can re-export with multiple', async () => {
      const memberId = v4();
      const createdAt = new Date();
      const rawRows = [
        {
          '流水號': 'id',
          '姓名': 'name',
          '帳號': 'username',
          '信箱': 'email',
          '身份': 'role',
          '手機1': 'phones.0',
          '手機2': 'phones.1',
          '分類1': 'categories.0',
          '分類2': 'categories.1',
          '測試屬性1': 'properties.0',
          '測試屬性2': 'properties.1',
          '標籤1': 'tags.0',
          '標籤2': 'tags.1',
          '星等': 'star',
          '建立日期': 'createdAt',
          '上次登入日期': 'loginedAt',
        },
        {
          '流水號': memberId,
          '姓名': 'test',
          '帳號': 'test_account',
          '信箱': 'test_email@test.com',
          '身份': 'general-member',
          '手機1': '0912345678',
          '手機2': '0923456789',
          '分類1': '測試分類1',
          '分類2': '測試分類2',
          '測試屬性1': '測試屬性1之值',
          '測試屬性2': '',
          '標籤1': '測試標籤1',
          '標籤2': '',
          '星等': '999',
          '建立日期': createdAt.toISOString(),
          '上次登入日期': '',
        },
      ];
      mockMemberInfra.getMembersByConditions.mockReturnValueOnce([]);
      mockDefinitionInfra.getCategories.mockReturnValueOnce([
        { id: 'test_category1_id', name: '測試分類1' },
        { id: 'test_category2_id', name: '測試分類2' },
      ]);
      mockDefinitionInfra.getProperties.mockReturnValueOnce([
        { id: 'test_property1_id', name: '測試屬性1' },
        { id: 'test_property2_id', name: '測試屬性2' },
      ])
      mockDefinitionInfra.getTags.mockReturnValueOnce([
        { name: '測試標籤1' },
        { name: '測試標籤2' },
      ]);
      
      const [headerInfos, _] = new MemberCsvHeaderMapping().deserializeFromRaw(rawRows.shift());
      const members = await service.rawCsvToMember('test-app-id', headerInfos, rawRows);
      const [member] = members;
      const exportedRawRows = await service.memberToRawCsv(headerInfos, members);
      expect(exportedRawRows.length).toBe(1);
      const [exportedRawRow] = exportedRawRows;
      expect(exportedRawRow['流水號']).toEqual(member.id);
      expect(exportedRawRow['姓名']).toEqual(member.name);
      expect(exportedRawRow['帳號']).toEqual(member.username);
      expect(exportedRawRow['信箱']).toEqual(member.email);
      expect(exportedRawRow['身份']).toEqual(member.role);
      expect(exportedRawRow['星等']).toEqual(member.star);
      expect(exportedRawRow['建立日期']).toEqual(member.createdAt.toISOString());
      expect(exportedRawRow['上次登入日期']).toEqual('');
      expect(exportedRawRow['手機1']).toEqual(member.memberPhones[0].phone);
      expect(exportedRawRow['手機2']).toEqual(member.memberPhones[1].phone);
      expect(exportedRawRow['分類1']).toEqual(member.memberCategories[0].category.name);
      expect(exportedRawRow['分類2']).toEqual(member.memberCategories[1].category.name);
      expect(exportedRawRow['測試屬性1']).toEqual(member.memberProperties[0].value);
      expect(exportedRawRow['測試屬性2']).toEqual('');
      expect(exportedRawRow['標籤1']).toEqual(member.memberTags[0].tagName2.name);
      expect(exportedRawRow['標籤2']).toEqual('');
    });
  });
});
