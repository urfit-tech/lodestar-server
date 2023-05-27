import { v4 } from 'uuid';
import { invert, trim } from 'lodash';
import { EntityManager } from 'typeorm';
import { validateOrReject, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { Property } from '~/definition/entity/property.entity';
import { Category } from '~/definition/entity/category.entity';
import { Tag } from '~/definition/entity/tag.entity';

import { MemberCsvHeaderMappingInfo } from './member.type';
import { CsvRawMemberDTO } from './member.dto';
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

    const validRows = this.deserializeFromRawRows(rawRows, headerInfos)
      .filter((eachRow) => validateSync(eachRow).length === 0)
      .map((eachRow: CsvRawMemberDTO) => {
        const memberId = eachRow.id || v4();

        const member = new Member();
        member.appId = appId;
        member.id = memberId;
        member.name = eachRow.name;
        member.email = eachRow.email,
        member.role = 'general-member';
        member.username = memberId;
        member.createdAt = eachRow.createdAt;
        member.star = parseInt(eachRow.star) || 0;
        member.memberCategories = eachRow.categories
          .filter((category) => appCategories.find(({ name }) => category === name))
          .map((category) => {
            const memberCategory = new MemberCategory();
            memberCategory.memberId = memberId;
            memberCategory.category = appCategories.find(({ name }) => category === name);
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
    return validRows;
  }

  async memberToRawCsv(
    headerInfos: MemberCsvHeaderMappingInfo,
    members: Array<Member>,
  ): Promise<Array<Record<string, any>>> {
    return [];
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
    return {} as any;
  }

  private deserializeFromRawRows(
    rows: Array<Record<string, any>>, header: MemberCsvHeaderMappingInfo,
  ): Array<CsvRawMemberDTO> {
    const deserializedRows = [];
    rows.forEach((row) => {
      const deserialized: Record<string, string | Array<string> | Record<string, string> | Date> = {};
      for (const humanReadableKey in row) {
        const codeReadable = invert(header)[humanReadableKey];
        const dataValue = trim(row[humanReadableKey]);
        switch(humanReadableKey) {
          case header.id:
          case header.name:
          case header.username:
          case header.email:
          case header.star:
            deserialized[codeReadable] = dataValue; continue;
          case header.createdAt:
            deserialized[codeReadable] = new Date(dataValue); continue;
          default:
            if (header.categories.includes(humanReadableKey)) {
              deserialized.categories = deserialized.categories
                ? [...(deserialized.categories as Array<string>), dataValue]
                : [dataValue];
            } else if (header.properties.includes(humanReadableKey)) {
              deserialized.properties = {
                ...(deserialized.properties as Record<string, string> || {}),
                [humanReadableKey]: dataValue,
              };
            } else if (header.phones.includes(humanReadableKey)) {
              deserialized.phones = deserialized.phones
                ? [...(deserialized.phones as Array<string>), dataValue]
                : [dataValue];
            } else if (header.tags.includes(humanReadableKey)) {
              deserialized.tags = deserialized.tags
                ? [...(deserialized.tags as Array<string>), dataValue]
                : [dataValue];
            }
        }
      }
      deserializedRows.push(deserialized);
    });
    return plainToInstance(CsvRawMemberDTO, deserializedRows);
  }
}
