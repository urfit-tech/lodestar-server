import { v4 } from 'uuid';
import { isNull } from 'lodash';
import { EntityManager, In } from 'typeorm';
import { ValidationError, isDateString, isEmpty } from 'class-validator';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { Property } from '~/definition/entity/property.entity';
import { Category } from '~/definition/entity/category.entity';
import { Tag } from '~/definition/entity/tag.entity';
import { isNullString } from '~/utils';

import { MemberCsvHeaderMapping } from './class/csvHeaderMapping';
import { CsvRawMember } from './class/csvRawMember';
import { MemberInfrastructure } from './member.infra';
import { MemberImportResultDTO } from './member.dto';
import { Member } from './entity/member.entity';
import { MemberCategory } from './entity/member_category.entity';
import { MemberProperty } from './entity/member_property.entity';
import { MemberPhone } from './entity/member_phone.entity';
import { MemberTag } from './entity/member_tag.entity';

@Injectable()
export class MemberService {
  constructor(
    private readonly definitionInfra: DefinitionInfrastructure,
    private readonly memberInfra: MemberInfrastructure,
    @InjectEntityManager('phdb') private readonly entityManager: EntityManager,
  ) {}

  async processImportFromFile(
    appId: string, rawRows: Array<Record<string, any>>,
  ): Promise<MemberImportResultDTO> {
    const [headerInfos, headerErrors] = new MemberCsvHeaderMapping().deserializeFromRaw(rawRows.shift());
    if (headerErrors.length > 0) {
      return {
        toInsertCount: rawRows.length,
        insertedCount: 0,
        failedCount: rawRows.length,
        failedErrors: headerErrors,
      };
    }

    const rawDeserializeResult = await this.rawCsvToMember(
      appId,
      headerInfos,
      rawRows,
      this.entityManager,
    );
    const membersToImport = rawDeserializeResult.filter(([_, errors]) => errors.length === 0);
    const deserializationFailed = rawDeserializeResult.filter(([_, errors]) => errors.length !== 0);
    const results = await Promise.allSettled(membersToImport.map(([member]) => {
      return this.entityManager.transaction(async (manager) => {
        try {
          const memberRepo = manager.getRepository(Member);
          const memberPropertyRepo = manager.getRepository(MemberProperty);
          const memberCategoryRepo = manager.getRepository(MemberCategory);
          const memberPhoneRepo = manager.getRepository(MemberPhone);
          const memberTagRepo = manager.getRepository(MemberTag);

          await memberCategoryRepo.delete({ memberId: member.id });
          await memberPhoneRepo.delete({ memberId: member.id });
          await memberTagRepo.delete({ memberId: member.id });

          await memberRepo.save(member);
          await memberCategoryRepo.save(member.memberCategories);
          await memberPropertyRepo.upsert(
            member.memberProperties,
            { conflictPaths: ['memberId', 'propertyId'] },
          );
          await memberPhoneRepo.save(member.memberPhones);
          await memberTagRepo.save(member.memberTags);
        } catch (error) {
          throw new Error(JSON.stringify({
            memberEmail: member.email,
            memberUsername: member.username,
            error,
          }));
        }
      });
    }));

    const fulfilleds = results.filter(
      (result) => result.status === 'fulfilled');
    const rejecteds: Array<any> = (results
      .filter((result) => result.status === 'rejected') as Array<PromiseRejectedResult>)
      .map(({ reason }) => reason);
    deserializationFailed
      .map(([_, errors]) => errors)
      .forEach((errors) => {
        const acc = {};
        errors.forEach(({ target, property, value, constraints }) => {
          const { id, username, email } = target as CsvRawMember;
          const identity = `${id}/${username}/${email}`;
          if (acc[identity] === undefined) {
            acc[identity] = [];
          }
          acc[identity].push({ property, value, constraints });
        });
        rejecteds.push(acc);
      });
    return {
      toInsertCount: rawDeserializeResult.length,
      insertedCount: fulfilleds.length,
      failedCount: rejecteds.length,
      failedErrors: rejecteds,
    };
  }

  async processExportFromDatabase(appId: string, memberIds: Array<string>): Promise<Array<Record<string, any>>> {
    const appCategories: Array<Category> = await this.definitionInfra.getCategories(
      appId, this.entityManager,
    );
    const appProperties: Array<Property> = await this.definitionInfra.getProperties(
      appId, this.entityManager,
    );
    const headerInfos = await new MemberCsvHeaderMapping().deserializeFromDataBase(5, 20, appCategories, appProperties);
    const fetchedMembers = await this.memberInfra.getMembersByConditions(appId, { id: In(memberIds) }, this.entityManager);

    return [
      await headerInfos.serializeToRawRow(),
      ...(await this.memberToRawCsv(headerInfos, fetchedMembers)),
    ];
  }

  async rawCsvToMember(
    appId: string,
    headerInfos: MemberCsvHeaderMapping,
    rawRows: Array<Record<string, string>>,
    entityManager: EntityManager,
  ): Promise<Array<[Member | null, Array<ValidationError>]>> {
    const appCategories: Array<Category> = await this.definitionInfra.getCategories(
      appId, this.entityManager,
    );
    const appProperties: Array<Property> = await this.definitionInfra.getProperties(
      appId, this.entityManager,
    );
    const appTags: Array<Tag> = await this.definitionInfra.getTags(this.entityManager);

    const members: Array<[Member | null, Array<ValidationError>]> = [];

    const deserialized = rawRows
      .map((rawRow) => new CsvRawMember().deserializedFromCsvRawRow(
        headerInfos, rawRow,
      ));
    
    for (const [eachRow, errors] of deserialized) {
      if (errors.length > 0) {
        members.push([null, errors]);
        continue;
      }

      const member = new Member();
      member.appId = appId;

      if (isEmpty(eachRow.id)) {
        member.id = v4();
        member.name = eachRow.name;
        member.username = eachRow.username || eachRow.id;
        member.email = eachRow.email;
        member.role = eachRow.role || 'general-member';
        member.star = parseInt(eachRow.star, 10);
        member.createdAt = isDateString(eachRow.createdAt)
          && new Date(eachRow.createdAt) || null;
        member.loginedAt = isDateString(eachRow.loginedAt)
          && new Date(eachRow.loginedAt) || null;
      } else {
        const inDbMember = await entityManager.getRepository(Member).findOne({
          where: { id: eachRow.id },
          relations: {
            memberProperties: { property: true },
          },
        });

        member.id = eachRow.id;
        member.name = eachRow.name === undefined || eachRow.name === ''
          ? inDbMember.name : eachRow.name;
        member.username = eachRow.username === undefined || eachRow.username === ''
          ? inDbMember.username : eachRow.username;
        member.email = isEmpty(eachRow.email) && inDbMember.email || eachRow.email;
        member.role = eachRow.role === undefined || eachRow.role === ''
          ? inDbMember.role : eachRow.role;
        member.star = isEmpty(eachRow.star) && inDbMember.star || parseInt(eachRow.star, 10);
        member.createdAt = isNullString(eachRow.createdAt) || eachRow.createdAt === null
          ? null
          : (eachRow.createdAt === '' || eachRow.createdAt === undefined) ? inDbMember.createdAt : new Date(eachRow.createdAt);
        member.loginedAt = isNullString(eachRow.loginedAt) || eachRow.loginedAt === null
          ? null
          : (eachRow.loginedAt === '' || eachRow.loginedAt === undefined) ? inDbMember.loginedAt : new Date(eachRow.loginedAt);
      }

      member.memberCategories = eachRow.categories
        .filter((category) => appCategories.find(({ name }) => category === name))
        .map((category) => {
          const appCategory = appCategories.find(({ name }) => category === name);
          const memberCategory = new MemberCategory();
          memberCategory.memberId = member.id;
          memberCategory.category = appCategory;
          memberCategory.position = appCategory.position;
          return memberCategory;
        });

      member.memberProperties = Object.keys(eachRow.properties)
        .filter((propertyKey) => eachRow.properties[propertyKey].length > 0
          && appProperties.find(({ name }) => name === propertyKey))
        .map((propertyKey) => {
          const memberProperty = new MemberProperty();
          memberProperty.memberId = member.id;
          memberProperty.property = appProperties.find(({ name }) => name === propertyKey);
          memberProperty.value = eachRow.properties[propertyKey];
          return memberProperty;
        });

      member.memberPhones = eachRow.phones
        .filter((phone) => phone.length > 0)
        .map((phone) => {
          const memberPhone = new MemberPhone();
          memberPhone.memberId = member.id;
          memberPhone.phone = phone;
          return memberPhone;
        });

      member.memberTags = eachRow.tags
        .filter((tag) => appTags.find(({ name }) => name === tag))
        .map((tag) => {
          const memberTag = new MemberTag();
          memberTag.memberId = member.id;
          memberTag.tagName2 = appTags.find(({ name }) => name === tag);
          return memberTag;
        });

      members.push([member, errors]);
    }

    return members;
  }

  async memberToRawCsv(
    headerInfos: MemberCsvHeaderMapping,
    members: Array<Member>,
  ): Promise<Array<Record<string, any>>> {
    return members
      .map((each) => {
        const csvRawMember = new CsvRawMember();
        csvRawMember.id = each.id;
        csvRawMember.name = each.name;
        csvRawMember.username = each.username;
        csvRawMember.email = each.email;
        csvRawMember.star = isNull(each.star)
          ? 'N/A' : each.star.toString();
        csvRawMember.role = each.role;
        csvRawMember.createdAt = isNull(each.createdAt)
          ? 'N/A' : each.createdAt.toISOString();
        csvRawMember.loginedAt = isNull(each.loginedAt)
          ? 'N/A' : each.loginedAt.toISOString();

        csvRawMember.categories = each.memberCategories.map(({ category }) => category.name);
        csvRawMember.properties = each.memberProperties.reduce(
          (acc, current) => {
            acc[current.property.name] = current.value;
            return acc;
          },
          {},
        );
        csvRawMember.phones = each.memberPhones.map(({ phone }) => phone);
        csvRawMember.tags = each.memberTags.map(({ tagName2 }) => tagName2.name);

        return csvRawMember;
      })
      .map((each) => each.serializeToCsvRawRow(headerInfos));
  }
}
