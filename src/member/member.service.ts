import { EntityManager, In } from 'typeorm';
import { ValidationError } from 'class-validator';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { Property } from '~/definition/entity/property.entity';
import { Category } from '~/definition/entity/category.entity';
import { Tag } from '~/definition/entity/tag.entity';

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
    // TODO: Process header deserialization failure.
    const [headerInfos, _] = new MemberCsvHeaderMapping().deserializeFromRaw(rawRows.shift());
    const membersToImport = await this.rawCsvToMember(appId, headerInfos, rawRows);
    const results = await Promise.allSettled(membersToImport.map((member) => {
      return this.entityManager.transaction(async (manager) => {
        try {
          const memberRepo = manager.getRepository(Member);
          const memberPropertyRepo = manager.getRepository(MemberProperty);
          const memberCategoryRepo = manager.getRepository(MemberCategory);
          const memberPhoneRepo = manager.getRepository(MemberPhone);
          const memberTagRepo = manager.getRepository(MemberTag);

          const patchedMember = await this.mergeDbMemberWhenImport(member, manager);

          await memberCategoryRepo.delete({ memberId: patchedMember.id });
          await memberPhoneRepo.delete({ memberId: patchedMember.id });
          await memberTagRepo.delete({ memberId: patchedMember.id });

          await memberRepo.save(patchedMember);
          await memberCategoryRepo.save(patchedMember.memberCategories);
          await memberPropertyRepo.upsert(
            patchedMember.memberProperties,
            { conflictPaths: ['memberId', 'propertyId'] },
          );
          await memberPhoneRepo.save(patchedMember.memberPhones);
          await memberTagRepo.save(patchedMember.memberTags);
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
    const rejecteds = results.filter(
      (result) => result.status === 'rejected') as Array<PromiseRejectedResult>;
    return {
      toInsertCount: membersToImport.length,
      insertedCount: fulfilleds.length,
      failedCount: rejecteds.length,
      failedErrors: rejecteds.map(({ reason }) => reason),
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
  ): Promise<Array<Member>> {
    const appCategories: Array<Category> = await this.definitionInfra.getCategories(
      appId, this.entityManager,
    );
    const appProperties: Array<Property> = await this.definitionInfra.getProperties(
      appId, this.entityManager,
    );
    const appTags: Array<Tag> = await this.definitionInfra.getTags(this.entityManager);

    return rawRows
      .map((rawRow) => new CsvRawMember().deserializedFromCsvRawRow(
        headerInfos, rawRow,
      ))
      .filter(([_, errors]: [CsvRawMember, Array<ValidationError>]) => errors.length === 0)
      .map(([eachRow, _]: [CsvRawMember, Array<ValidationError>]) => {
        const member = new Member();
        member.appId = appId;
        member.id = eachRow.id;
        member.name = eachRow.name;
        member.email = eachRow.email;
        member.role = eachRow.role;
        member.username = eachRow.username || eachRow.id;
        member.createdAt = eachRow.createdAt;
        member.loginedAt = eachRow.loginedAt;
        member.star = eachRow.star || 0;

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

        return member;
      });
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
        csvRawMember.star = each.star;
        csvRawMember.role = each.role;
        csvRawMember.createdAt = each.createdAt;
        csvRawMember.loginedAt = each.loginedAt;
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

  private async mergeDbMemberWhenImport(newMember: Member, entityManager: EntityManager): Promise<Member> {
    const inDbMember = await entityManager.getRepository(Member).findOne({
      where: { id: newMember.id },
      relations: {
        memberProperties: { property: true },
      },
    });

    if (inDbMember === null) {
      return {
        ...newMember,
        role: newMember.role ? newMember.role : 'general-member',
      };
    }

    const { role: inDbRole, memberProperties: inDbProperties } = inDbMember;
    const { role: newRole, memberProperties: newProperties } = newMember;
    newMember.role = newRole ? newRole : inDbRole;
    newMember.memberProperties = newProperties.map((newProperty) => {
      const found = inDbProperties.find((inDbProperty) => newProperty.id === inDbProperty.id);
      if (found) {
        found.value = newProperty.value;
        return found;
      }
      return newProperty;
    });
    
    return newMember;
  }
}
