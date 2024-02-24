import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import * as uuid from 'uuid';

import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { LeadWebhookBody } from './lead.dto';
import { MemberInfrastructure } from '~/member/member.infra';
import { Member } from '~/member/entity/member.entity';
import { AppCache } from '~/app/app.type';
import parsePhoneNumberFromString from 'libphonenumber-js';

@Injectable()
export class LeadService {
  constructor(
    private readonly memberInfra: MemberInfrastructure,
    private readonly definitionInfra: DefinitionInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async storeLead(app: AppCache, body: LeadWebhookBody) {
    const propertyNameToField = {
      填單日期: 'created_time',
      廣告素材: 'ad_name',
      廣告組合: 'adset_name',
      行銷活動: 'campaign_name',
      觸及平台: 'platform',
      縣市: 'city',
    };
    const properties = await this.definitionInfra.upsertProperties(
      app.id,
      Object.keys(propertyNameToField),
      this.entityManager,
    );

    await this.entityManager.transaction(async (entityManager) => {
      const member = await this.upsertMember(entityManager, app.id, {
        email: body.email,
        name: body.full_name,
        username: body.email,
        role: 'general-member',
      });
      await Promise.all(
        properties.map((property) => {
          return this.memberInfra.upsertMemberProperty(
            entityManager,
            member.id,
            property.id,
            body[propertyNameToField[property.name]],
          );
        }),
      );

      await this.memberInfra.upsertMemberPhone(entityManager, member.id, this.parsePhoneNumber(body.phone_number));
    });
  }

  private async upsertMember(
    entityManager: EntityManager,
    appId: string,
    data: {
      email: string;
      name: string;
      username: string;
      role: string;
    },
  ) {
    let member = await this.memberInfra.firstMemberByCondition(entityManager, {
      appId,
      email: data.email,
    });
    if (member) {
      const metadata = member.metadata as { is_distributed?: boolean; from_lead_webhook_at: string };
      member.metadata = {
        ...metadata,
        is_distributed: metadata.is_distributed ?? false,
        from_lead_webhook_at: metadata.from_lead_webhook_at ?? new Date().toISOString(),
      };
    } else {
      const memberRepo = entityManager.getRepository(Member);
      member = memberRepo.create({
        id: uuid.v4(),
        appId,
        email: data.email,
        name: data.name,
        username: data.username,
        role: data.role,
        metadata: {
          is_distributed: false,
          from_lead_webhook_at: new Date().toISOString(),
        },
      });
    }
    return this.memberInfra.saveMember(entityManager, member);
  }

  private parsePhoneNumber(phoneNumber: string) {
    return parsePhoneNumberFromString(phoneNumber).formatNational().replace(/\s+/g, '');
  }
}
