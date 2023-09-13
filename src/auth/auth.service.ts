import { EntityManager } from 'typeorm';
import { sign, verify as jwtVerify } from 'jsonwebtoken';
import { Logger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';

import { SignupProperty } from '~/entity/SignupProperty';
import { MemberInfrastructure } from '~/member/member.infra';
import { MemberRole } from '~/member/member.type';
import { AppService } from '~/app/app.service';
import { APIException } from '~/api.excetion';
import { AppCache } from '~/app/app.type';

import { JwtDTO } from './auth.dto';
import { CrossServerTokenDTO } from './auth.type';

@Injectable()
export class AuthService {
  private readonly hasuraJwtSecret: string;

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService<{ HASURA_JWT_SECRET: string }>,
    private readonly appService: AppService,
    private readonly memberInfra: MemberInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {
    this.hasuraJwtSecret = configService.getOrThrow('HASURA_JWT_SECRET');
  }

  async generateCrossServerToken(appCache: AppCache, dto: CrossServerTokenDTO) {
    return this.entityManager.transaction(async (manager) => {
      const { clientId, key, permissions } = dto;

      const app = await this.appService.getAppByClientId(clientId, manager);
      if (!app) {
        throw new APIException({ code: 'E_NOT_FOUND', message: "client ID doesn't exist" });
      }

      const { id: appId, appSecrets } = app;
      const authServiceKeySecret = appSecrets.find(({ key }) => key === 'auth.service.key');
      if (!authServiceKeySecret || authServiceKeySecret.value !== key) {
        throw new APIException({ code: 'E_AUTH_TOKEN', message: 'key is not authenticated' });
      }

      return this.signJWT(
        appCache,
        {
          sub: clientId,
          appId,
          role: MemberRole.APP_OWNER,
          permissions,
        },
        '12 hours',
        manager,
      );
    });
  }

  verify(token: string): Record<string, any> {
    return jwtVerify(token, this.hasuraJwtSecret) as Record<string, any>;
  }

  private async signJWT(
    appCache: AppCache,
    payload: JwtDTO,
    expiresIn = '1 day',
    manager: EntityManager,
  ) {
    const { defaultPermissions } = appCache;
    const isFinishedSignUpProperty = payload?.memberId
      ? await this.checkUndoneSignUpProperty(payload.appId, payload.memberId, manager)
      : true;

    defaultPermissions.forEach((each) => {
      if (!payload.permissions.includes(each)) {
        payload.permissions.push(each);
      }
    });

    const claim = {
      ...payload,
      isFinishedSignUpProperty,
      'https://hasura.io/jwt/claims': {
        'x-hasura-allowed-roles': [payload.role],
        'x-hasura-default-role': payload.role,
        'x-hasura-user-id': payload.sub,
        'x-hasura-app-id': payload.appId,
        'x-hasura-org-id': payload?.orgId || '',
      },
    };
    return sign(claim, this.hasuraJwtSecret, { expiresIn });
  }

  private async getSignUpPropertyIds(appId: string, manager: EntityManager) {
    const signUpPropertyRepo = manager.getRepository(SignupProperty);
    const founds = await signUpPropertyRepo.find({
      where: { appId },
      relations: { property: true },
    });

    return founds.filter(({ isRequired }) => !!isRequired).map(({ property }) => property.id);
  }

  private async checkUndoneSignUpProperty(appId: string, memberId: string, manager: EntityManager) {
    const requiredPropertyIds = await this.getSignUpPropertyIds(appId, manager);
    const requiredMemberProperties = await this.memberInfra.getMemberPropertiesByIds(
      memberId,
      requiredPropertyIds,
      manager,
    );

    if (requiredMemberProperties.some(({ value }) => value === '')) {
      return false;
    } else if (requiredPropertyIds.length !== requiredMemberProperties.length) {
      return false;
    }
    return true;
  }
}
