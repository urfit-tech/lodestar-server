import { v4 } from 'uuid';
import { EntityManager, In } from 'typeorm';
import { validateSync } from 'class-validator';
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
    const headerInfos = await new MemberCsvHeaderMapping().deserializeFromRaw(rawRows.shift());
    const membersToImport = await this.rawCsvToMember(appId, headerInfos, rawRows);
    const results = await Promise.allSettled(membersToImport.map((member) => {
      return this.entityManager.transaction(async (manager) => {
        try {
          await manager.save(member);
          await manager.save(member.memberCategories);
          await manager.save(member.memberProperties);
          await manager.save(member.memberPhones);
          await manager.save(member.memberTags);
        } catch (error) {
          throw new Error(JSON.stringify({
            memberEmail: member.email,
            memberUsername: member.username,
            error,
          }));
        }
      });
    }));

    return {
      toInsertCount: membersToImport.length,
      insertedCount: results.filter((result) => result.status === 'fulfilled').length,
      failedCount: results.filter((result) => result.status === 'rejected').length,
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

    return rawRows.map((rawRow) => {
      const csvRawMember = new CsvRawMember();
      return csvRawMember.deserializedFromCsvRawRow(headerInfos, rawRow);
    }).filter((eachRow) => validateSync(eachRow).length === 0)
      .map((eachRow: CsvRawMember) => {
      const memberId = eachRow.id || v4();

      const member = new Member();
      member.appId = appId;
      member.id = memberId;
      member.name = eachRow.name;
      member.email = eachRow.email,
      member.role = 'general-member';
      member.username = memberId;
      member.createdAt = eachRow.createdAt;
      member.star = eachRow.star || 0;
      member.memberCategories = eachRow.categories
        .filter((category) => appCategories.find(({ name }) => category === name))
        .map((category) => {
          const appCategory = appCategories.find(({ name }) => category === name);
          const memberCategory = new MemberCategory();
          memberCategory.memberId = memberId;
          memberCategory.category = appCategory;
          memberCategory.position = appCategory.position;
          return memberCategory;
        });
      member.memberProperties = Object.keys(eachRow.properties)
        .filter((propertyKey) => eachRow.properties[propertyKey].length > 0
          && appProperties.find(({ name }) => name === propertyKey))
        .map((propertyKey) => {
          const memberProperty = new MemberProperty();
          memberProperty.memberId = memberId;
          memberProperty.property = appProperties.find(({ name }) => name === propertyKey);
          memberProperty.value = eachRow.properties[propertyKey];
          return memberProperty;
        });
      member.memberPhones = eachRow.phones
        .filter((phone) => phone.length > 0)
        .map((phone) => {
          const memberPhone = new MemberPhone();
          memberPhone.memberId = memberId;
          memberPhone.phone = phone;
          return memberPhone;
        });
      member.memberTags = eachRow.tags
        .filter((tag) => appTags.find(({ name }) => name === tag))
        .map((tag) => {
          const memberTag = new MemberTag();
          memberTag.memberId = memberId;
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
        csvRawMember.createdAt = each.createdAt;
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
