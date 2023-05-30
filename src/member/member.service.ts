import { v4 } from 'uuid';
import { EntityManager } from 'typeorm';
import { validateOrReject, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { parse } from 'csv-parse/sync';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { Property } from '~/definition/entity/property.entity';
import { Category } from '~/definition/entity/category.entity';
import { Tag } from '~/definition/entity/tag.entity';

import { MemberCsvHeaderMappingInfo } from './member.type';
import { CsvRawMember } from './class/csvRawMember';
import { Member } from './entity/member.entity';
import { MemberCategory } from './entity/member_category.entity';
import { MemberProperty } from './entity/member_property.entity';
import { MemberPhone } from './entity/member_phone.entity';
import { MemberTag } from './entity/member_tag.entity';

@Injectable()
export class MemberService {
  constructor(
    private readonly definitionInfra: DefinitionInfrastructure,
    @InjectEntityManager('phdb') private readonly entityManager: EntityManager,
  ) {}

  async processMemberImportFromFile(
    appId: string, mimeType: string, rawBin: Buffer,
  ): Promise<void> {
    let rawRows: Array<any> = [];
    switch (mimeType){
      case 'application/vnd.ms-excel':
        // convert excel to json
        break;
      default:
        rawRows = parse(rawBin, { columns: true, skip_empty_lines: true });
        break;
    }

    const headerInfos = await this.parseHeaderInfoFromColumn(rawRows.shift());
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
  }

  async rawCsvToMember(
    appId: string,
    headerInfos: MemberCsvHeaderMappingInfo,
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
    headerInfos: MemberCsvHeaderMappingInfo,
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

  /**
   * First row of file is human readable header, and the second one is for code.
   * @Param headerRow, key will be first row, value is second row.
   */
  public async parseHeaderInfoFromColumn(headerRow: Record<string, string>): Promise<MemberCsvHeaderMappingInfo> {
    const info: MemberCsvHeaderMappingInfo = {
      id: '',
      name: '',
      username: '',
      email: '',
      categories: [],
      properties: [],
      phones: [],
      tags: [],
      star: '',
      createdAt: '',
    };
    
    for (const humanReadable in headerRow) {
      const codeReadable = headerRow[humanReadable];
      const [key] = codeReadable.split('.');
      switch (codeReadable) {
        case 'id':
        case 'name':
        case 'username':
        case 'email':
        case 'star':
        case 'createdAt':
          info[key] = humanReadable; continue;
        default:
          if (codeReadable.startsWith('categories.')) {
            info.categories.push(humanReadable);
          } else if (codeReadable.startsWith('properties.')) {
            info.properties.push(humanReadable);
          } else if (codeReadable.startsWith('phones.')) {
            info.phones.push(humanReadable);
          } else if (codeReadable.startsWith('tags.')) {
            info.tags.push(humanReadable);
          }
          continue;
      }
    }

    const transformedInfo = plainToInstance(MemberCsvHeaderMappingInfo, info);
    await validateOrReject(transformedInfo);
    return transformedInfo;
  }

  public async formHeaderInfoFromData(
    maxPhoneCount: number,
    appCategories: Array<Category>,
    appProperties: Array<Property>,
    appTags: Array<Tag>,
  ): Promise<MemberCsvHeaderMappingInfo> {
    const info: MemberCsvHeaderMappingInfo = {
      id: '流水號',
      name: '姓名',
      username: '帳號',
      email: '信箱',
      categories: [...Array(appCategories.length).keys()].map((each) => `分類${(each + 1).toString()}`),
      properties: appProperties.map(({ name }) => name),
      phones: [...Array(maxPhoneCount).keys()].map((each) => `手機${(each + 1).toString()}`),
      tags: [...Array(appTags.length).keys()].map((each) => `標籤${(each + 1).toString()}`),
      star: '星等',
      createdAt: '建立日期',
    };

    await validateOrReject(info);
    return info;
  }
}
