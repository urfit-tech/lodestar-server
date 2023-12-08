import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { AppService } from '~/app/app.service';
import { DefinitionInfrastructure } from '~/definition/definition.infra';
import { MemberService } from '~/member/member.service';
import { LeadWebhookBody } from './lead.dto';
import { MemberProperty } from '~/member/entity/member_property.entity';
import { MemberPhone } from '~/member/entity/member_phone.entity';
import { APIException } from '~/api.excetion';

@Injectable()
export class LeadService {
  constructor(
    private readonly appService: AppService,
    private readonly memberService: MemberService,
    private readonly definitionInfra: DefinitionInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async storeLead(appId: string, body: LeadWebhookBody) {
    this.entityManager.transaction(async (entityManager) => {
      const app = await this.appService.getAppInfo(appId);
      if (!app) {
        throw new APIException(
          {
            code: 'E_APP_NOT_FOUND',
            message: 'app not found',
            result: { appId },
          },
          404,
        );
      }
      const propertyNameToField = {
        填單日期: 'created_time',
        廣告素材: 'adset_name',
        廣告組合: 'ad_name',
        行銷活動: 'campaign_name',
        觸及平台: 'platform',
        縣市: 'city',
      };
      const properties = await this.definitionInfra.upsertProperties(
        appId,
        Object.keys(propertyNameToField),
        entityManager,
      );
      const member = await this.memberService.upsertMemberBy(
        {
          appId: app.id,
          email: body.email,
          name: body.full_name,
          username: body.email,
          role: 'general-member',
        },
        {
          appId: app.id,
          email: body.email,
        },
      );
      const memberPropertyRepo = entityManager.getRepository(MemberProperty);
      const newProperties = properties.map((property) => {
        const memberProperty = memberPropertyRepo.create({
          memberId: member.id,
          propertyId: property.id,
          value: body[propertyNameToField[property.name]],
        });
        return memberProperty;
      });
      await memberPropertyRepo.save(newProperties);
      const phoneRepo = entityManager.getRepository(MemberPhone);
      const phone = phoneRepo.create({
        memberId: member.id,
        phone: body.phone_number,
      });
      await phoneRepo.save(phone);
    });
  }
}
