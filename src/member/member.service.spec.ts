import { v4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';

import { DefinitionInfrastructure } from '~/definition/definition.infra';

import { MemberService } from './member.service';

describe('MemberService', () => {
  let service: MemberService;
  let mockDefinitionInfra = {
    getCategories: jest.fn(),
    getProperties: jest.fn(),
    getTags: jest.fn(),
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
          provide: getEntityManagerToken('phdb'),
          useValue: mockEntityManager,
          
        }
      ],
    }).compile();

    service = module.get<MemberService>(MemberService);
  });

  afterEach(() => jest.resetAllMocks());

  describe('#rawCsvToMember', () => {
    it('Should raise error due to incorrect header format', async () => {
      const rawRows = [
        { '姓名': 'name' },
      ];
      (
        await service.rawCsvToMember('test-app-id', rawRows)
          .catch((err) => err)
      ).forEach(({ constraints }) => {
        expect(constraints.isNotEmpty).not.toBeUndefined();
        expect(constraints.isNotEmpty).toMatch(' should not be empty');
      });
    });

    it('Should process all included categories, properties, tags, phones', async () => {
      const memberId = v4();
      const createdAt = new Date().toISOString();
      const rawRows = [
        {
          '流水號': 'id',
          '姓名': 'name',
          '帳號': 'username',
          '信箱': 'email',
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
        },
        {
          '流水號': memberId,
          '姓名': 'test',
          '帳號': 'test_account',
          '信箱': 'test_email@test.com',
          '手機1': '0912345678',
          '手機2': '0923456789',
          '分類1': 'test_category1',
          '分類2': 'test_category2',
          '屬性1': 'test_property1',
          '屬性2': 'test_property2',
          '標籤1': 'test_tag1',
          '標籤2': 'test_tag2',
          '星等': '999',
          '建立日期': createdAt,
        },
      ];
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
      
      const [member] = await service.rawCsvToMember('test-app-id', rawRows);
      expect(member.id).toBe(memberId);
      expect(member.name).toBe('test');
      expect(member.username).toBe(memberId);
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
      expect(member.createdAt).toBe(createdAt);
    });

    it('Should allow missing partial categories, properties, tags, phones', async () => {
      const memberId = v4();
      const createdAt = new Date().toISOString();
      const rawRows = [
        {
          '流水號': 'id',
          '姓名': 'name',
          '帳號': 'username',
          '信箱': 'email',
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
        },
        {
          '流水號': memberId,
          '姓名': 'test_partial_missing',
          '帳號': 'test_partial_missing_account',
          '信箱': 'test_partial_missing_email@test.com',
          '手機1': '0912345678',
          '手機2': '',
          '分類1': 'test_category1',
          '分類2': '',
          '屬性1': 'test_property1',
          '屬性2': '',
          '標籤1': 'test_tag1',
          '標籤2': '',
          '星等': '999',
          '建立日期': createdAt,
        },
      ];
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

      const [member] = await service.rawCsvToMember('test-app-id', rawRows);
      expect(member.id).toBe(memberId);
      expect(member.name).toBe('test_partial_missing');
      expect(member.username).toBe(memberId);
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
      expect(member.createdAt).toBe(createdAt);
    });
  });
});
