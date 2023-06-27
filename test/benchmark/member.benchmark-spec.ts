import { EntityManager, In, Repository } from 'typeorm';
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

describe('MemberService (benchmark)', () => {
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
    it('Should import with 100K data rows', async () => {
      const sampleCount = 100 * 1000;
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
      ];
      for (let i = 0; i < sampleCount; i++) {
        rawRows.push({
          '流水號': '',
          '姓名': `test${i}`,
          '帳號': `test${i}_account`,
          '信箱': `test${i}_email@test.com`,
          '身份': 'general-member',
          '手機1': '',
          '手機2': '',
          '分類1': 'test_category1',
          '分類2': 'test_category2',
          [memberProperty.name]: `test_value_test${i}`,
          '屬性2': 'test_property2',
          '標籤1': 'test_tag1',
          '標籤2': 'test_tag2',
          '星等': `${i}`,
          '建立日期': createdAt.toISOString(),
          '上次登入日期': '',
        });
      }
      const {
        toInsertCount,
        insertedCount,
        failedCount,
        failedErrors,
      } = await service.processImportFromFile(app.id, rawRows);
      expect(toInsertCount).toBe(sampleCount);
      expect(insertedCount).toBe(sampleCount);
      expect(failedCount).toBe(0);
      expect(failedErrors.length).toBe(0);

      const toExpectSampleCount = 20;
      const randomNumbers = [...new Array(toExpectSampleCount)].map(() => Math.floor(Math.random() * sampleCount));
      const members = await memberRepo.find({
        where: {
          name: In(randomNumbers.map((i) => `test${i}`)),
          username: In(randomNumbers.map((i) => `test${i}_account`)),
          email: In(randomNumbers.map((i) => `test${i}_email@test.com`)),
        },
        relations: {
          memberProperties: { property: true },
        },
      });
      expect(members.length).toBe(randomNumbers.length);
      randomNumbers.forEach((i) => {
        const findMember = members.find((member) => member.username === `test${i}_account`);
        expect(findMember).not.toBeUndefined();
        const { name, email, memberProperties } = findMember;
        expect(name).toBe(`test${i}`);
        expect(email).toBe(`test${i}_email@test.com`);

        const findProperty = memberProperties.find((property) => property.property.name === memberProperty.name);
        const { value } = findProperty;
        expect(findProperty).not.toBeUndefined();
        expect(value).toBe(`test_value_test${i}`);
      });
    });

    it.only('Should import with 100K rows but 10K is corrupted', async () => {
      const sampleCount = 100 * 1000;
      const corruptCount = sampleCount * 0.01;
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
      ];

      const corruptedNumbers = [];
      let insertedCorruptCount = 0;
      for (let i = 0; i < sampleCount; i++) {
        if (insertedCorruptCount < corruptCount && Math.floor(Math.random() * 100) < 50) {
          corruptedNumbers.push(i);
          rawRows.push({
            '流水號': '',
            '姓名': `test${i}`,
            '帳號': `test${i}_account`,
            '信箱': `invalid-email-format-${i}`,
            '身份': 'general-member',
            '手機1': '',
            '手機2': '',
            '分類1': 'test_category1',
            '分類2': 'test_category2',
            [memberProperty.name]: `test_value_test${i}`,
            '屬性2': 'test_property2',
            '標籤1': 'test_tag1',
            '標籤2': 'test_tag2',
            '星等': `invalid-star-format-${i}`,
            '建立日期': createdAt.toISOString(),
            '上次登入日期': '',
          });
          insertedCorruptCount += 1;
        } else {
          rawRows.push({
            '流水號': '',
            '姓名': `test${i}`,
            '帳號': `test${i}_account`,
            '信箱': `test${i}_email@test.com`,
            '身份': 'general-member',
            '手機1': '',
            '手機2': '',
            '分類1': 'test_category1',
            '分類2': 'test_category2',
            [memberProperty.name]: `test_value_test${i}`,
            '屬性2': 'test_property2',
            '標籤1': 'test_tag1',
            '標籤2': 'test_tag2',
            '星等': `${i}`,
            '建立日期': createdAt.toISOString(),
            '上次登入日期': '',
          });
        }
      }
      const {
        toInsertCount,
        insertedCount,
        failedCount,
        failedErrors,
      } = await service.processImportFromFile(app.id, rawRows);
      expect(toInsertCount).toBe(sampleCount);
      expect(insertedCount).toBe(sampleCount - corruptCount);
      expect(failedCount).toBe(corruptCount);
      expect(failedErrors.length).toBe(corruptCount);

      const toExpectSampleCount = 20;
      const randomNumbers = [...new Array(toExpectSampleCount)]
        .map(() => Math.floor(Math.random() * sampleCount))
        .filter((each) => !corruptedNumbers.includes(each));
      const members = await memberRepo.find({
        where: {
          name: In(randomNumbers.map((i) => `test${i}`)),
          username: In(randomNumbers.map((i) => `test${i}_account`)),
          email: In(randomNumbers.map((i) => `test${i}_email@test.com`)),
        },
        relations: {
          memberProperties: { property: true },
        },
      });
      expect(members.length).toBe(randomNumbers.length);
      randomNumbers.forEach((i) => {
        const findMember = members.find((member) => member.username === `test${i}_account`);
        expect(findMember).not.toBeUndefined();
        const { name, email, memberProperties } = findMember;
        expect(name).toBe(`test${i}`);
        expect(email).toBe(`test${i}_email@test.com`);

        const findProperty = memberProperties.find((property) => property.property.name === memberProperty.name);
        const { value } = findProperty;
        expect(findProperty).not.toBeUndefined();
        expect(value).toBe(`test_value_test${i}`);
      });

      const corruptedMembers = await memberRepo.find({
        where: { name: In(corruptedNumbers.map((i) => `test${i}`)) },
      });
      expect(corruptedMembers.length).toBe(0);
      corruptedNumbers.forEach((i) => {
        const foundErrorMap = failedErrors.find((each: Record<string, Array<any>>) => each[
          `undefined/test${i}_account/invalid-email-format-${i}`
        ] !== undefined);
        expect(foundErrorMap).not.toBeUndefined();
        const foundError = foundErrorMap[`undefined/test${i}_account/invalid-email-format-${i}`];
        expect(foundError).not.toBeUndefined();

        const emailError = foundError.find(({ property }) => property === 'email');
        const starError = foundError.find(({ property }) => property === 'star');
        expect(emailError).not.toBeUndefined();
        expect(emailError.value).toBe(`invalid-email-format-${i}`);
        expect(emailError.constraints.isEmail).not.toBeUndefined();
        expect(starError).not.toBeUndefined();
        expect(starError.value).toBe(`invalid-star-format-${i}`);
        expect(starError.constraints.isNumberString).not.toBeUndefined();
      });
    });
  });
});
