import { v4 } from 'uuid';
import { EntityManager, Repository } from 'typeorm';
import { ValidationError } from 'class-validator';
import { INestApplication } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';

import { ApplicationModule } from '~/application.module';
import { AppPlan } from '~/entity/AppPlan';
import { App } from '~/entity/App';
import { Category } from '~/definition/entity/category.entity';
import { Property } from '~/definition/entity/property.entity';
import { Tag } from '~/definition/entity/tag.entity';
import { MemberService } from '~/member/member.service';
import { Member } from '~/member/entity/member.entity';
import { MemberPhone } from '~/member/entity/member_phone.entity';
import { MemberCategory } from '~/member/entity/member_category.entity';
import { MemberProperty } from '~/member/entity/member_property.entity';
import { MemberTag } from '~/member/entity/member_tag.entity';

import { anotherCategory, anotherMemberTag, app, appPlan, category, memberProperty, memberTag } from '../data';

describe('MemberService (e2e)', () => {
  let application: INestApplication;
  let service: MemberService;

  let manager: EntityManager;
  let memberPhoneRepo: Repository<MemberPhone>;
  let memberCategoryRepo: Repository<MemberCategory>;
  let memberPropertyRepo: Repository<MemberProperty>;
  let memberTagRepo: Repository<MemberTag>;
  let memberRepo: Repository<Member>;
  let appPlanRepo: Repository<AppPlan>;
  let appRepo: Repository<App>;
  let categoryRepo: Repository<Category>;
  let propertyRepo: Repository<Property>;
  let tagRepo: Repository<Tag>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    application = moduleFixture.createNestApplication();
    service = application.get(MemberService);

    manager = application.get<EntityManager>(getEntityManagerToken('phdb'));
    memberPhoneRepo = manager.getRepository(MemberPhone);
    memberCategoryRepo = manager.getRepository(MemberCategory);
    memberPropertyRepo = manager.getRepository(MemberProperty);
    memberTagRepo = manager.getRepository(MemberTag);
    memberRepo = manager.getRepository(Member);
    appPlanRepo = manager.getRepository(AppPlan);
    appRepo = manager.getRepository(App);
    categoryRepo = manager.getRepository(Category);
    propertyRepo = manager.getRepository(Property);
    tagRepo = manager.getRepository(Tag);

    await memberPhoneRepo.delete({});
    await memberCategoryRepo.delete({});
    await memberPropertyRepo.delete({});
    await memberTagRepo.delete({});
    await memberRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});
    await categoryRepo.delete({});
    await propertyRepo.delete({});
    await tagRepo.delete({});

    await appPlanRepo.save(appPlan);
    await appRepo.save(app);
    await categoryRepo.save(category);
    await categoryRepo.save(anotherCategory);
    await propertyRepo.save(memberProperty);
    await tagRepo.save(memberTag);
    await tagRepo.save(anotherMemberTag);

    await application.init();
  });

  afterEach(async () => {
    await memberPhoneRepo.delete({});
    await memberCategoryRepo.delete({});
    await memberPropertyRepo.delete({});
    await memberTagRepo.delete({});
    await memberRepo.delete({});
    await categoryRepo.delete({});
    await propertyRepo.delete({});
    await tagRepo.delete({});
    await memberRepo.delete({});
    await appRepo.delete({});
    await appPlanRepo.delete({});

    await application.close();
  });

  describe('Method processImportFromFile', () => {
    it('Should return header error', async () => {
      const rawRows = [{}];
      const {
        toInsertCount, insertedCount, failedCount, failedErrors,
      } = await service.processImportFromFile(app.id, rawRows);
      expect(toInsertCount).toBe(0);
      expect(insertedCount).toBe(0);
      expect(failedCount).toBe(0);
      expect(failedErrors.length).toBeGreaterThan(0);

      const missingIdError = failedErrors.find(({ property }) => property === 'id');
      expect(missingIdError).not.toBeUndefined();
      expect(missingIdError.constraints.isNotEmpty).not.toBeUndefined();
      expect(missingIdError.constraints.isString).not.toBeUndefined();
    });

    it('Should return data error', async () => {
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
        },
        {
          '流水號': 'invalid-uuid-format',
          '姓名': 'name',
          '帳號': 'username',
          '信箱': 'email@example.com',
          '手機1': '',
          '手機2': '',
          '分類1': '',
          '分類2': '',
          '屬性1': '',
          '屬性2': '',
          '標籤1': '',
          '標籤2': '',
        },
      ];
      const {
        toInsertCount, insertedCount, failedCount, failedErrors,
      } = await service.processImportFromFile(app.id, rawRows);
      expect(toInsertCount).toBe(1);
      expect(insertedCount).toBe(0);
      expect(failedCount).toBe(1);
      expect(failedErrors.length).toBeGreaterThan(0);

      const errors = failedErrors
        .find((each: Record<string, Array<{
          property: string;
          constraints: Record<string, string>;
        }>>) => Object.keys(each).find((key) => key.includes('invalid-uuid-format/username/email@example.com')));
      const idError = errors['invalid-uuid-format/username/email@example.com'];
      expect(idError[0].property).toBe('id');
      expect(idError[0].constraints.isUuid).not.toBeUndefined();
    });

    it('Should insert not exists members', async () => {
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
          [memberProperty.name]: 'properties.0',
          '屬性2': 'properties.1',
          '標籤1': 'tags.0',
          '標籤2': 'tags.1',
          '星等': 'star',
          '建立日期': 'createdAt',
          '上次登入日期': 'loginedAt',
        },
        {
          '流水號': '',
          '姓名': 'test',
          '帳號': 'test_account',
          '信箱': 'test_email@test.com',
          '身份': 'general-member',
          '手機1': '0912345678',
          '手機2': '0912345678',
          '分類1': 'test_category1',
          '分類2': 'test_category2',
          [memberProperty.name]: 'test_value1',
          '屬性2': 'test_property2',
          '標籤1': 'test_tag1',
          '標籤2': 'test_tag2',
          '星等': '999',
          '建立日期': createdAt.toISOString(),
          '上次登入日期': '',
        },
      ];
      const insertResult = await service.processImportFromFile(app.id, rawRows);
      expect(insertResult.toInsertCount).toBe(1);
      expect(insertResult.insertedCount).toBe(1);
      expect(insertResult.failedCount).toBe(0);
      expect(insertResult.failedErrors.length).toBe(0);

      const member = await memberRepo.findOne({
        where: { name: 'test', username: 'test_account' },
        relations: {
          memberCategories: { category: true },
          memberProperties: { property: true },
          memberPhones: true,
          memberTags: { tagName2: true },
        },
      },);
      expect(member).not.toBeUndefined();
      expect(member.name).toBe('test');
      expect(member.username).toBe('test_account');
      expect(member.email).toBe('test_email@test.com');
      expect(member.memberPhones.length).toBe(1);
      expect(member.memberPhones[0].phone).toBe('0912345678');
      member.memberCategories.forEach((memberCategory) => {
        expect(['test_category1_id', 'test_category2_id']).toContain(memberCategory.category.id);
      });
      member.memberProperties.forEach((inMemberProperty) => {
        if (inMemberProperty.property.id === memberProperty.id) {
          expect(inMemberProperty.value).toEqual('test_value1');
        } else {
          expect(inMemberProperty.value).toEqual('test_property2');
        }
      });
      member.memberTags.forEach((memberTag) => {
        expect(['test_tag1', 'test_tag2']).toContain(memberTag.tagName2.name);
      });
      expect(member.star).toBe('999');
      expect(member.createdAt).toStrictEqual(createdAt);
    });

    it('Should update values with optional missing values', async () => {
      const insertedMember = new Member();
      insertedMember.appId = app.id;
      insertedMember.id = v4();
      insertedMember.name = 'inserted_name';
      insertedMember.username = 'inserted_account';
      insertedMember.email = 'inserted_email@example.com';
      insertedMember.role = 'general-member';
      insertedMember.star = 666;
      insertedMember.createdAt = new Date();
      insertedMember.loginedAt = null;

      const insertedMemberPhone = new MemberPhone();
      insertedMemberPhone.member = insertedMember;
      insertedMemberPhone.phone = '0912345678';

      const insertedMemberCategory = new MemberCategory();
      insertedMemberCategory.member = insertedMember;
      insertedMemberCategory.category = category;
      insertedMemberCategory.position = 1;

      const insertedMemberProperty = new MemberProperty();
      insertedMemberProperty.member = insertedMember;
      insertedMemberProperty.property = memberProperty;
      insertedMemberProperty.value = 'test_property';

      const insertedMemberTag = new MemberTag();
      insertedMemberTag.member = insertedMember;
      insertedMemberTag.tagName2 = memberTag;

      await memberRepo.save(insertedMember);
      await memberPhoneRepo.save(insertedMemberPhone);
      await memberCategoryRepo.save(insertedMemberCategory);
      await memberPropertyRepo.save(insertedMemberProperty);
      await memberTagRepo.save(insertedMemberTag);

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
          [memberProperty.name]: 'properties.0',
          '屬性2': 'properties.1',
          '標籤1': 'tags.0',
          '標籤2': 'tags.1',
          '星等': 'star',
          '建立日期': 'createdAt',
          '上次登入日期': 'loginedAt',
        },
        {
          '流水號': insertedMember.id,
          '姓名': '',
          '帳號': 'test_account',
          '信箱': 'test_email@test.com',
          '身份': 'general-member',
          '手機1': '',
          '手機2': '',
          '分類1': '',
          '分類2': '',
          [memberProperty.name]: 'test_value1',
          '屬性2': '',
          '標籤1': '',
          '標籤2': '',
          '星等': '',
          '建立日期': insertedMember.createdAt.toISOString(),
          '上次登入日期': '',
        },
      ];
      const insertResult = await service.processImportFromFile(app.id, rawRows);
      expect(insertResult.toInsertCount).toBe(1);
      expect(insertResult.insertedCount).toBe(1);
      expect(insertResult.failedCount).toBe(0);
      expect(insertResult.failedErrors.length).toBe(0);

      const member = await memberRepo.findOne({
        where: { id: insertedMember.id },
        relations: {
          memberCategories: { category: true },
          memberProperties: { property: true },
          memberPhones: true,
          memberTags: { tagName2: true },
        },
      },);
      expect(member).not.toBeUndefined();
      expect(member.name).toBe('inserted_name');
      expect(member.username).toBe('test_account');
      expect(member.email).toBe('test_email@test.com');
      expect(member.memberPhones.length).toBe(0);
      expect(member.memberCategories.length).toBe(0);
      member.memberProperties.forEach((inMemberProperty) => {
        if (inMemberProperty.property.id === memberProperty.id) {
          expect(inMemberProperty.value).toEqual('test_value1');
        } else {
          expect(inMemberProperty.value).toEqual('test_property2');
        }
      });
      expect(member.memberTags.length).toBe(0);
      expect(member.star).toBe('666');
      expect(member.createdAt).toStrictEqual(insertedMember.createdAt);
    });

    it('Should update values if given member is exists', async () => {
      const insertedMember = new Member();
      insertedMember.appId = app.id;
      insertedMember.id = v4();
      insertedMember.name = 'inserted_name';
      insertedMember.username = 'inserted_account';
      insertedMember.email = 'inserted_email@example.com';
      insertedMember.role = 'general-member';
      insertedMember.star = 555;
      insertedMember.createdAt = new Date();
      insertedMember.loginedAt = null;

      const insertedMemberPhone = new MemberPhone();
      insertedMemberPhone.member = insertedMember;
      insertedMemberPhone.phone = '0912345678';

      const insertedMemberCategory = new MemberCategory();
      insertedMemberCategory.member = insertedMember;
      insertedMemberCategory.category = category;
      insertedMemberCategory.position = 1;

      const insertedMemberProperty = new MemberProperty();
      insertedMemberProperty.member = insertedMember;
      insertedMemberProperty.property = memberProperty;
      insertedMemberProperty.value = 'test_property';

      const insertedMemberTag = new MemberTag();
      insertedMemberTag.member = insertedMember;
      insertedMemberTag.tagName2 = memberTag;

      await memberRepo.save(insertedMember);
      await memberPhoneRepo.save(insertedMemberPhone);
      await memberCategoryRepo.save(insertedMemberCategory);
      await memberPropertyRepo.save(insertedMemberProperty);
      await memberTagRepo.save(insertedMemberTag);

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
          [memberProperty.name]: 'properties.0',
          '屬性2': 'properties.1',
          '標籤1': 'tags.0',
          '標籤2': 'tags.1',
          '星等': 'star',
          '建立日期': 'createdAt',
          '上次登入日期': 'loginedAt',
        },
        {
          '流水號': insertedMember.id,
          '姓名': insertedMember.name,
          '帳號': insertedMember.username,
          '信箱': insertedMember.email,
          '身份': insertedMember.role,
          '手機1': '0900000008',
          '手機2': '',
          '分類1': '',
          '分類2': anotherCategory.name,
          [memberProperty.name]: 'updated-value',
          '屬性2': 'test_property2',
          '標籤1': 'test_tag1',
          '標籤2': anotherMemberTag.name,
          '星等': '999',
          '建立日期': insertedMember.createdAt.toISOString(),
          '上次登入日期': '',
        },
      ];

      const result = await service.processImportFromFile(app.id, rawRows);
      expect(result.toInsertCount).toBe(1);
      expect(result.insertedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.failedErrors.length).toBe(0);
      const member = await memberRepo.findOne({
        where: { id: insertedMember.id },
        relations: {
          memberCategories: { category: true },
          memberProperties: { property: true },
          memberPhones: true,
          memberTags: { tagName2: true },
        },
      });
      expect(member.id).toBe(insertedMember.id);
      expect(member.name).toBe(insertedMember.name);
      expect(member.username).toBe(insertedMember.username);
      expect(member.email).toBe(insertedMember.email);
      expect(member.star).toBe('999');
      expect(member.createdAt).toStrictEqual(insertedMember.createdAt);
      expect(member.loginedAt).toBeNull();
      expect(member.memberPhones.length).toBe(1);
      expect(member.memberPhones.find(({ phone }) => phone === insertedMemberPhone.phone)).toBeUndefined();
      expect(member.memberPhones.find(({ phone }) => phone === '0900000008')).not.toBeUndefined();
      expect(member.memberCategories.length).toBe(1);
      expect(member.memberCategories.find((each) => each.category.name === category.name)).toBeUndefined();
      expect(member.memberCategories.find((each) => each.category.name === anotherCategory.name)).not.toBeUndefined();
      expect(member.memberProperties.length).toBe(1);
      expect(member.memberProperties[0].value).toBe('updated-value');
      expect(member.memberTags.length).toBe(1);
      expect(member.memberTags.find(({ tagName2 }) => tagName2.name === memberTag.name)).toBeUndefined();
      expect(member.memberTags.find(({ tagName2 }) => tagName2.name === anotherMemberTag.name)).not.toBeUndefined();
    });

    describe('Should raise error if some fields missed when import for insert new data', () => {
      async function testField(
        testFieldName: string,
        testDataPostfix: string,
        toSet: Function,
        toExpect: Function,
        fullMatch = true,
      ) {
        const rawRows = [
          {
            '流水號': 'id',
            '姓名': 'name',
            '帳號': 'username',
            '信箱': 'email',
            '身份': 'role',
            '星等': 'star',
            '建立日期': 'createdAt',
            '上次登入日期': 'loginedAt',
            '手機1': 'phones.0',
            '分類1': 'categories.0',
            [memberProperty.name]: 'properties.0',
            '標籤1': 'tags.0',
          },
          {
            '流水號': '',
            '姓名': 'to-insert-name',
            '帳號': 'to-insert-username',
            '信箱': 'to-insert-email@example.com',
            '身份': 'to-insert-role',
            '星等': '999',
            '建立日期': '',
            '上次登入日期': '',
            '手機1': '',
            '分類1': '',
            [memberProperty.name]: '',
            '標籤1': '',
          },
        ];

        const readableHeaderNames = Object
          .entries(rawRows[0] as Record<string, string>)
          .filter(([_, codeReadable]) => fullMatch
            ? codeReadable === testFieldName
            : codeReadable.includes(testFieldName))
          .map(([humanReadable]) => humanReadable);
        for (let i = 0; i < rawRows.length; i++) {
          for (let j = 0; j < readableHeaderNames.length; j++) {
            toSet(readableHeaderNames[j], rawRows[i]);
          }
        }

        const result = await service.processImportFromFile(app.id, rawRows);
        expect(result.toInsertCount).toBe(1);
        expect(result.insertedCount).toBe(0);
        expect(result.failedCount).toBe(1);
        expect(result.failedErrors.length).toBe(1);
        toExpect(result);
      };
      const setUndefined = (key: string, value: Record<string, string>) =>
        delete value[key];
      const setBlank = (key: string, value: Record<string, string>) =>
        value[key] = '';

      it('Field username', async () => {
        const toExpect = ({ failedErrors }: {
          failedErrors: Array<Record<string, Array<ValidationError>>>;
        }) => {
          const error = Object.values(failedErrors.pop()).pop()
            .find(({ property }) => property === 'username');
          expect(error.constraints.isNotEmpty).not.toBeUndefined();
          expect(error.constraints.isString).not.toBeUndefined();
        };
        await testField('username', 'blank', setBlank, toExpect),
        await testField('username', 'undefined', setUndefined, toExpect);
      });

      it('Field star', async () => {
        const toExpect = ({ failedErrors }: {
          failedErrors: Array<Record<string, Array<ValidationError>>>;
        }) => {
          const error = Object.values(failedErrors.pop()).pop()
            .find(({ property }) => property === 'star');
          expect(error.constraints.isNotEmpty).not.toBeUndefined();
          expect(error.constraints.isNumberString).not.toBeUndefined();
        };
        await testField('star', 'blank', setBlank, toExpect),
        await testField('star', 'undefined', setUndefined, toExpect);
      });
    });

    describe('Should remained value if given field is blank or undefined', () => {
      async function testField(
        testFieldName: string,
        testDataPostfix: string,
        toSet: Function,
        toExpect: Function,
        fullMatch = true,
      ) {
        let insertedMember = new Member();
        insertedMember.appId = app.id;
        insertedMember.id = v4();
        insertedMember.name = `${testFieldName}_${testDataPostfix}`;
        insertedMember.username = `acc_${testFieldName}_${testDataPostfix}`;
        insertedMember.email = `mail_${testFieldName}_${testDataPostfix}@example.com`;
        insertedMember.role = 'general-member';
        insertedMember.star = 0;
        insertedMember.createdAt = new Date();
        insertedMember.loginedAt = new Date();

        let insertedMemberPhone = new MemberPhone();
        insertedMemberPhone.member = insertedMember;
        insertedMemberPhone.phone = '0987654321';

        let insertedMemberCategory = new MemberCategory();
        insertedMemberCategory.member = insertedMember;
        insertedMemberCategory.category = category;
        insertedMemberCategory.position = 0;

        let insertedMemberProperty = new MemberProperty();
        insertedMemberProperty.member = insertedMember;
        insertedMemberProperty.property = memberProperty;
        insertedMemberProperty.value = '1234';

        let insertedMemberTag = new MemberTag();
        insertedMemberTag.member = insertedMember;
        insertedMemberTag.tagName2 = memberTag;

        insertedMember = await memberRepo.save(insertedMember);
        insertedMemberPhone = await memberPhoneRepo.save(insertedMemberPhone);
        insertedMemberCategory = await memberCategoryRepo.save(insertedMemberCategory);
        insertedMemberProperty = await memberPropertyRepo.save(insertedMemberProperty);
        insertedMemberTag = await memberTagRepo.save(insertedMemberTag);

        const rawRows = [
          {
            '流水號': 'id',
            '姓名': 'name',
            '帳號': 'username',
            '信箱': 'email',
            '身份': 'role',
            '星等': 'star',
            '建立日期': 'createdAt',
            '上次登入日期': 'loginedAt',
            '手機1': 'phones.0',
            '分類1': 'categories.0',
            [insertedMemberProperty.property.name]: 'properties.0',
            '標籤1': 'tags.0',
          },
          {
            '流水號': insertedMember.id,
            '姓名': insertedMember.name,
            '帳號': insertedMember.username,
            '信箱': insertedMember.email,
            '身份': insertedMember.role,
            '星等': insertedMember.star,
            '建立日期': insertedMember.createdAt.toISOString(),
            '上次登入日期': insertedMember.loginedAt.toISOString(),
            '手機1': insertedMemberPhone.phone,
            '分類1': insertedMemberCategory.category.name,
            [insertedMemberProperty.property.name]: insertedMemberProperty.value,
            '標籤1': insertedMemberTag.tagName2.name,
          },
        ];

        const readableHeaderNames = Object
          .entries(rawRows[0] as Record<string, string>)
          .filter(([_, codeReadable]) => fullMatch
            ? codeReadable === testFieldName
            : codeReadable.includes(testFieldName))
          .map(([humanReadable]) => humanReadable);
        for (let i = 0; i < rawRows.length; i++) {
          for (let j = 0; j < readableHeaderNames.length; j++) {
            toSet(readableHeaderNames[j], rawRows[i]);
          }
        }

        const result = await service.processImportFromFile(app.id, rawRows);
        expect(result.toInsertCount).toBe(1);
        expect(result.insertedCount).toBe(1);
        expect(result.failedCount).toBe(0);
        expect(result.failedErrors.length).toBe(0);
        const member = await memberRepo.findOne({
          where: { id: insertedMember.id },
          relations: {
            memberCategories: { category: true },
            memberProperties: { property: true },
            memberPhones: true,
            memberTags: { tagName2: true },
          },
        });
        expect(member.id).toBe(insertedMember.id);
        expect(member.email).toBe(insertedMember.email);
        toExpect({
          member,
          insertedMember,
          insertedMemberPhone,
          insertedMemberCategory,
          insertedMemberProperty,
          insertedMemberTag,
        });
      };
      const setUndefined = (key: string, value: Record<string, string>) =>
        delete value[key];
      const setBlank = (key: string, value: Record<string, string>) =>
        value[key] = '';

      it('Field name', async () => {
        const toExpect = ({ member, insertedMember }: { member: Member; insertedMember: Member }) => {
          expect(member.name).toBe(insertedMember.name);
        };
        await testField('name', 'blank', setBlank, toExpect);
        await testField('name', 'undefined', setUndefined, toExpect);
      });

      it('Field username', async () => {
        const toExpect = ({ member, insertedMember }: { member: Member; insertedMember: Member }) => {
          expect([insertedMember.id, insertedMember.username]).toContain(member.username);
        };
        await testField('username', 'blank', setBlank, toExpect),
        await testField('username', 'undefined', setUndefined, toExpect);
      });

      it('Field role', async () => {
        const toExpect = ({ member, insertedMember }: { member: Member; insertedMember: Member }) => {
          expect(member.role).toBe(insertedMember.role);
        };
        await testField('role', 'blank', setBlank, toExpect),
        await testField('role', 'undefined', setUndefined, toExpect);
      });

      it('Field star', async () => {
        const toExpect = ({ member, insertedMember }: { member: Member; insertedMember: Member }) => {
          expect(member.star).toBe(insertedMember.star);
        };
        await testField('star', 'blank', setBlank, toExpect),
        await testField('star', 'undefined', setUndefined, toExpect);
      });

      it('Field createdAt', async () => {
        const toExpect = ({ member, insertedMember }: { member: Member; insertedMember: Member }) => {
          expect(member.createdAt).toStrictEqual(insertedMember.createdAt);
        };
        await testField('createdAt', 'blank', setBlank, toExpect),
        await testField('createdAt', 'undefined', setUndefined, toExpect);
      });

      it('Field loginedAt', async () => {
        const toExpect = ({ member, insertedMember }: { member: Member; insertedMember: Member }) => {
          expect(member.loginedAt).toStrictEqual(insertedMember.loginedAt);
        };
        await testField('loginedAt', 'blank', setBlank, toExpect),
        await testField('loginedAt', 'undefined', setUndefined, toExpect);
      });

      it('Field phones', async () => {
        const toExpect = ({
          member,
          insertedMemberCategory,
          insertedMemberProperty,
          insertedMemberTag,
        }: {
          member: Member;
          insertedMemberCategory: MemberCategory;
          insertedMemberProperty: MemberProperty;
          insertedMemberTag: MemberTag;
        }) => {
          expect(member.memberPhones.length).toBe(0);
          expect(member.memberCategories[0].category.id).toBe(insertedMemberCategory.category.id);
          expect(member.memberProperties[0].property.name).toBe(insertedMemberProperty.property.name);
          expect(member.memberProperties[0].value).toBe(insertedMemberProperty.value);
          expect(member.memberTags[0].tagName2.name).toBe(insertedMemberTag.tagName2.name);
        };
        await testField('phones', 'blank', setBlank, toExpect, false),
        await testField('phones', 'undefined', setUndefined, toExpect, false);
      });

      it('Field categories', async () => {
        const toExpect = ({
          member,
          insertedMemberPhone,
          insertedMemberProperty,
          insertedMemberTag,
        }: {
          member: Member;
          insertedMemberPhone: MemberPhone;
          insertedMemberProperty: MemberProperty;
          insertedMemberTag: MemberTag;
        }) => {
          expect(member.memberPhones[0].phone).toBe(insertedMemberPhone.phone);
          expect(member.memberCategories.length).toBe(0);
          expect(member.memberProperties[0].property.name).toBe(insertedMemberProperty.property.name);
          expect(member.memberProperties[0].value).toBe(insertedMemberProperty.value);
          expect(member.memberTags[0].tagName2.name).toBe(insertedMemberTag.tagName2.name);
        };
        await testField('categories', 'blank', setBlank, toExpect, false),
        await testField('categories', 'undefined', setUndefined, toExpect, false);
      });

      it('Field properties', async () => {
        const toExpect = ({
          member,
          insertedMemberPhone,
          insertedMemberCategory,
          insertedMemberProperty,
          insertedMemberTag,
        }: {
          member: Member;
          insertedMemberPhone: MemberPhone;
          insertedMemberCategory: MemberCategory;
          insertedMemberProperty: MemberProperty;
          insertedMemberTag: MemberTag;
        }) => {
          expect(member.memberPhones[0].phone).toBe(insertedMemberPhone.phone);
          expect(member.memberCategories[0].category.id).toBe(insertedMemberCategory.category.id);
          expect(member.memberProperties[0].property.name).toBe(insertedMemberProperty.property.name);
          expect(member.memberProperties[0].value).toBe(insertedMemberProperty.value);
          expect(member.memberTags[0].tagName2.name).toBe(insertedMemberTag.tagName2.name);
        };
        await testField('properties', 'blank', setBlank, toExpect, false),
        await testField('properties', 'undefined', setUndefined, toExpect, false);
      });

      it('Field tags', async () => {
        const toExpect = ({
          member,
          insertedMemberPhone,
          insertedMemberCategory,
          insertedMemberProperty,
        }: {
          member: Member;
          insertedMemberPhone: MemberPhone;
          insertedMemberCategory: MemberCategory;
          insertedMemberProperty: MemberProperty;
        }) => {
          expect(member.memberPhones[0].phone).toBe(insertedMemberPhone.phone);
          expect(member.memberCategories[0].category.id).toBe(insertedMemberCategory.category.id);
          expect(member.memberProperties[0].property.name).toBe(insertedMemberProperty.property.name);
          expect(member.memberProperties[0].value).toBe(insertedMemberProperty.value);
          expect(member.memberTags.length).toBe(0);
        };
        await testField('tags', 'blank', setBlank, toExpect, false),
        await testField('tags', 'undefined', setUndefined, toExpect, false);
      });
    });
  });
});
