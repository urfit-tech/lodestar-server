import { EntityManager } from 'typeorm'
import { sign } from 'jsonwebtoken';
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm'

import { SignupProperty } from '~/entity/SignupProperty'
import { MemberService } from '~/member/member.service'
import { MemberRole, PublicMember } from '~/member/member.type'
import { AppInfrastructure } from '~/app/app.infra';
import { PermissionService } from '~/permission/permission.service'
import { APIException } from '~/api.excetion';

import { CrossServerTokenDTO } from './auth.type'

@Injectable()
export class AuthService {
  private readonly hasuraJwtSecret: string;

  constructor(
    private readonly configService: ConfigService<{ HASURA_JWT_SECRET: string }>,
    private readonly memberService: MemberService,
    private readonly permissionService: PermissionService,
    private readonly appInfra: AppInfrastructure,
    @InjectEntityManager('phdb') private readonly entityManager: EntityManager,
  ) {
    this.hasuraJwtSecret = configService.getOrThrow('HASURA_JWT_SECRET');
  }

  async generateCrossServerToken(dto: CrossServerTokenDTO) {
    return this.entityManager.transaction(async (manager) => {
      const { clientId, key, permissions } = dto;

      const app = await this.appInfra.getAppByClientId(clientId, manager);
      if (!app) {
        throw new APIException({ code: 'E_NOT_FOUND', message: "client ID doesn't exist" });
      }

      const { id: appId, appSecrets } = app;
      const authServiceKeySecret = appSecrets.find(({ key }) => key === 'auth.service.key');
      if (!authServiceKeySecret || authServiceKeySecret.value !== key) {
        throw new APIException({ code: 'E_AUTH_TOKEN', message: 'key is not authenticated' });
      }

      return this.signJWT({
        sub: clientId,
        appId,
        role: MemberRole.APP_OWNER,
        permissions,
      }, '12 hours', manager);
    });
  }

  private async signJWT(
    payload: {
      sub: string
      orgId?: string | null
      appId: string
      memberId?: string
      name?: string
      username?: string
      email?: string
      phoneNumber?: string
      role: string
      permissions: (string | null)[]
      isBusiness?: boolean | null
      loggedInMembers?: PublicMember[]
      options?: { [key: string]: any }
    },
    expiresIn = '1 day',
    manager: EntityManager,
  ) {
    const settings = await this.appInfra.getAppSettings(payload.appId, manager);
    const defaultPermissionIds = JSON.parse(settings['feature.membership_default_permission'] || '[]') as Array<string>
    const permissions = await this.permissionService.getByIds(defaultPermissionIds, manager);
    const validatePermissions = permissions.map(({ id }) => id)
    const invalidatePermissions = defaultPermissionIds.filter((each) => !validatePermissions.includes(each))
    console.error(`Invalidate Permission: ${invalidatePermissions}`)

    const isFinishedSignUpProperty = payload?.memberId
      ? await this.checkUndoneSignUpProperty(payload.appId, payload.memberId, manager)
      : true

    validatePermissions.forEach((each) => {
      if (!payload.permissions.includes(each)) {
        payload.permissions.push(each)
      }
    })
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
    }
    return sign(claim, this.hasuraJwtSecret, { expiresIn })
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
    const requiredMemberProperties = await this.memberService.getMemberPropertiesByIds(memberId, requiredPropertyIds, manager);
  
    if (requiredMemberProperties.some(({ value }) => value === '')) {
      return false
    } else if (requiredPropertyIds.length !== requiredMemberProperties.length) {
      return false
    }
    return true
  }
}
