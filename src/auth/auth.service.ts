import { EntityManager } from 'typeorm';
import { sign, verify as jwtVerify } from 'jsonwebtoken';
import { Logger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';

import { SignupProperty } from '~/entity/SignupProperty';
import { MemberInfrastructure } from '~/member/member.infra';
import { MemberRole, PublicMember } from '~/member/member.type';
import { AppService } from '~/app/app.service';
import { PermissionService } from '~/permission/permission.service';
import { APIException } from '~/api.excetion';

import { CrossServerTokenDTO } from './auth.type';
import { CacheService } from '~/utility/cache/cache.service';
import { randomBytes } from 'crypto';
import dayjs from 'dayjs';
import { AuthAuditLog } from './entity/auth_audit_log.entity';
import { AuthInfrastructure } from './auth.infra';
import { MemberService } from '~/member/member.service';

@Injectable()
export class AuthService {
  private readonly hasuraJwtSecret: string;

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService<{ HASURA_JWT_SECRET: string }>,
    private readonly appService: AppService,
    private readonly permissionService: PermissionService,
    private readonly memberInfra: MemberInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly cacheService: CacheService,
    private readonly authInfra: AuthInfrastructure,
    private readonly memberService: MemberService,
  ) {
    this.hasuraJwtSecret = configService.getOrThrow('HASURA_JWT_SECRET');
  }

  async generateCrossServerToken(dto: CrossServerTokenDTO) {
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
    payload: {
      sub: string;
      orgId?: string | null;
      appId: string;
      memberId?: string;
      name?: string;
      username?: string;
      email?: string;
      phoneNumber?: string;
      role: string;
      permissions: (string | null)[];
      isBusiness?: boolean | null;
      loggedInMembers?: PublicMember[];
      options?: { [key: string]: any };
    },
    expiresIn = '1 day',
    manager: EntityManager,
  ) {
    const settings = await this.appService.getAppSettings(payload.appId, manager);
    const defaultPermissionIds = JSON.parse(settings['feature.membership_default_permission'] || '[]') as Array<string>;
    const permissions = await this.permissionService.getByIds(defaultPermissionIds, manager);
    const validatePermissions = permissions.map(({ id }) => id);
    const invalidatePermissions = defaultPermissionIds.filter((each) => !validatePermissions.includes(each));
    console.error(`Invalidate Permission: ${invalidatePermissions}`);

    const isFinishedSignUpProperty = payload?.memberId
      ? await this.checkUndoneSignUpProperty(payload.appId, payload.memberId, manager)
      : true;

    validatePermissions.forEach((each) => {
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

  async generateTmpPassword(appId: string, email: string, applicant: string, purpose: string) {
    const { data: memberData } = await this.memberService.getMembersByCondition(appId, { limit: 1 }, { email });
    if (memberData.length === 0) {
      throw new APIException({
        code: 'E_NO_MEMBER',
        message: 'member not found',
        result: null,
      });
    }

    const redisCli = this.cacheService.getClient();
    const password = this.generateRandomHash();
    const key = `tmpPass:${appId}:${email}`;
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    const expiredAt = dayjs().add(THREE_DAYS, 'millisecond').toDate();
    await redisCli.set(key, password, 'PX', THREE_DAYS);

    await this.insertAuthAuditLog(applicant, memberData[0].id, purpose);
    return { password, expiredAt };
  }

  private generateRandomHash() {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
    let password = '';
    const byteLength = Math.ceil((length * 256) / charset.length);
    const randomArray = randomBytes(byteLength);
    for (let i = 0; i < length; i++) {
      password += charset[randomArray[i] % charset.length];
    }
    return password;
  }

  private async insertAuthAuditLog(applicant: string, userMemberId: string, purpose: string): Promise<void> {
    const authAuditLog = new AuthAuditLog();
    authAuditLog.action = 'apply_temporary_password';
    authAuditLog.memberId = applicant;
    authAuditLog.target = userMemberId;
    authAuditLog.metadata = { reason: purpose };
    await this.authInfra.insertAuthAuditLog(authAuditLog, this.entityManager);
  }
}
