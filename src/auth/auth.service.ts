import { EntityManager } from 'typeorm';
import bcrypt from 'bcrypt';
import { sign, verify as jwtVerify } from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import dayjs from 'dayjs';
import { plainToInstance } from 'class-transformer';
import { Logger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';

import { SignupProperty } from '~/entity/SignupProperty';
import { MemberInfrastructure } from '~/member/member.infra';
import { MemberRole, PublicMember } from '~/member/member.type';
import { MemberService } from '~/member/member.service';
import { Member } from '~/member/entity/member.entity';
import { MemberDevice } from '~/member/entity/member_device.entity';
import { AppService } from '~/app/app.service';
import { EmailService } from '~/mailer/email/email.service';
import { UtilityService } from '~/utility/utility.service';
import { CacheService } from '~/utility/cache/cache.service';
import { APIException } from '~/api.excetion';
import { AppCache } from '~/app/app.type';

import { AuthAuditLog } from './entity/auth_audit_log.entity';
import { JwtDTO } from './auth.dto';
import { CrossServerTokenDTO, LoginStatus, RefreshStatus } from './auth.type';
import { AuthInfrastructure } from './auth.infra';
import DeviceService from './device/device.service';

@Injectable()
export class AuthService {
  private readonly nodeEnv: string;
  private readonly hasuraJwtSecret: string;

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService<{
      NODE_ENV: string;
      HASURA_JWT_SECRET: string;
    }>,
    private readonly appService: AppService,
    private readonly deviceService: DeviceService,
    private readonly mailService: EmailService,
    private readonly cacheService: CacheService,
    private readonly authInfra: AuthInfrastructure,
    private readonly utilityService: UtilityService,
    private readonly memberService: MemberService,
    private readonly memberInfra: MemberInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {
    this.nodeEnv = configService.getOrThrow('NODE_ENV');
    this.hasuraJwtSecret = configService.getOrThrow('HASURA_JWT_SECRET');
  }

  async generalLogin(
    appCache: AppCache,
    options: {
      appId: string;
      account: string;
      password: string;
      loggedInMembers: PublicMember[];
    },
    manager?: EntityManager,
  ): Promise<{ status: LoginStatus; authToken?: string; member?: any; }> {
    const cb = async (manager: EntityManager) => {
      const { orgId } = appCache;
      // get possible members
      const { appId, account: usernameOrEmail, password, loggedInMembers } = options;
      const member = await this.memberInfra.getGeneralLoginMemberByUsernameOrEmail(appId, usernameOrEmail, manager);
      if (!member) {
        return { status: LoginStatus.E_NO_MEMBER };
      }

      const temporaryPassword = await this.cacheService.getClient().get(`tmpPass:${appId}:${usernameOrEmail}`);

      if (temporaryPassword !== password) {
        // migrated/3rd account with no password
        if (!member.passhash) {
          await this.sendResetPasswordEmail(appCache, member, manager);
          return { status: LoginStatus.I_RESET_PASSWORD };
        }
        // check password
        if (!bcrypt.compareSync(password, member.passhash)) {
          return { status: LoginStatus.E_PASSWORD };
        }
        await this.insertLastLoginJobIntoQueue(member.id);
      }

      const jwtPayload = await this.buildJwtPayload(orgId, member, loggedInMembers, manager);
      const authToken = await this.signJWT(appCache, jwtPayload, '1 day', manager);

      return { status: LoginStatus.SUCCESS, member, authToken };
    };
    return cb(manager ? manager : this.entityManager);
  }

  async refreshToken(
    appCache: AppCache,
    options: {
      fingerPrintId: string;
      sessionMemberId: string,
      loggedInMembers: Array<PublicMember>,
    },
    manager?: EntityManager,
  ): Promise<{ status: RefreshStatus; fingerPrintId?: string; refreshedToken?: string }> {
    const cb = async (manager: EntityManager) => {
      const { id: appId, orgId } = appCache;
      const { fingerPrintId, sessionMemberId, loggedInMembers } = options;
      if (!sessionMemberId) {
        return { status: RefreshStatus.E_NO_MEMBER };
      }

      const member = await this.memberInfra.getById(appId, sessionMemberId, manager);
      if (!member) {
        return { status: RefreshStatus.E_NO_MEMBER };
      }

      const { modules: appModules } = appCache;
      const isLoginAndDeviceModuleEnable = appModules.includes('login_restriction') || appModules.includes('device_management');
      
      if (member.role !== 'app-owner' && isLoginAndDeviceModuleEnable) {
        const device: MemberDevice | undefined = await this.deviceService.getByFingerprintId(member.id, fingerPrintId);
        if (device && !device.isLogin) {
          return { status: RefreshStatus.E_SESSION_DESTROY };
        }
      }
      await this.insertLastLoginJobIntoQueue(member.id);

      const jwtPayload = await this.buildJwtPayload(orgId, member, loggedInMembers, manager);
      const refreshedToken = await this.signJWT(appCache, jwtPayload, '1 day', manager);

      return { status: RefreshStatus.SUCCESS, fingerPrintId, refreshedToken };
    };
    return cb(manager ? manager : this.entityManager);
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

  private async buildJwtPayload(
    orgId: string | undefined,
    member: Member,
    logginedInMembersInSession: Array<PublicMember>,
    manager: EntityManager,
  ): Promise<JwtDTO> {
    const publicMember: PublicMember = {
      orgId: orgId || '',
      id: member.id,
      appId: member.appId,
      email: member.email,
      username: member.username,
      name: member.name,
      pictureUrl: member.pictureUrl,
      isBusiness: member.isBusiness,
    };

    const { id: memberId } = member;
    const metadata = await this.memberInfra.getLoginMemberMetadata(memberId, manager);
    const { phones, oauths, permissions } = metadata.pop();
    const loggedInMembers = logginedInMembersInSession.filter(({ id }) => id !== memberId);

    const plain: JwtDTO = {
      sub: memberId,
      appId: member.appId,
      role: member.role,
      permissions: (permissions || []).map(({ permissionId }) => permissionId),
      orgId: orgId || '',
      memberId,
      name: member.name,
      username: member.username,
      email: member.email,
      phoneNumber: phones && phones.length > 0 ? phones.pop().phone : '',
      isBusiness: member.isBusiness,
      loggedInMembers: [...loggedInMembers, publicMember],
      pictureUrl: member.pictureUrl,
      options: oauths || {},
    };
    return plainToInstance(JwtDTO, plain);
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

  private async sendResetPasswordEmail(
    appCache: AppCache, member: Member, manager: EntityManager,
  ) {
    const { id: appId, name: appName, host: appHost } = appCache;

    // create reset password token
    const currentTimePer30min = Math.floor(Date.now() / 3000 / 600)
    const resetPasswordToken = this.utilityService.generateMD5Hash(`${currentTimePer30min}${member.id}`);

    const subject = `[${appName}] 重設您的密碼 ${this.nodeEnv !== 'production' ? '(測試)' : ''}`;
    const partials = {
      appTitle: appName,
      url: `https://${appHost}/reset-password?token=${resetPasswordToken}&member=${member.id}`,
    }

    await this.mailService.insertEmailJobIntoQueue({
      appId,
      catalog: 'reset-password',
      targetMemberIds: [member.email],
      partials,
      subject,
      manager,
    });
  }

  private async insertLastLoginJobIntoQueue(memberId: string) {
    return this.cacheService
      .getClient()
      .set(
        `last-logged-in:${memberId}`,
        new Date().toISOString(),
        'EX',
        7 * 86400,
      );
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
