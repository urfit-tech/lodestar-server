import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { EntityManager } from 'typeorm';
import UAParser from 'ua-parser-js'

import { AppCache } from '~/app/app.type';
import { MemberDevice } from '~/member/entity/member_device.entity';
import { MemberInfrastructure } from '~/member/member.infra';
import { MemberRole } from '~/member/member.type';

import { LoginDeviceStatus } from './device.type';

@Injectable()
export default class DeviceService {
  constructor(
    private readonly memberInfra: MemberInfrastructure,
    @InjectEntityManager() private entityManager: EntityManager,
  ) {}

  getFingerPrintFromUa(defaultFingerPrint: string, userAgent?: string): string {
    if (!userAgent) {
      return defaultFingerPrint;
    }

    const uaResult = UAParser(userAgent);
    switch (uaResult.browser.name) {
      case 'Edge':
        return createHash('md5').update(`Edge${defaultFingerPrint}`).digest('hex');
      default:
        return defaultFingerPrint;
    }
  }

  async getByFingerprintId(memberId: string, fingerPrintId: string) {
    const devices = await this.memberInfra.getMemberDevices(memberId, this.entityManager);
    return devices.find((device) => device.id === fingerPrintId);
  }

  async checkAndBindDevices(
    appCache: AppCache,
    options: {
      appId: string;
      memberId: string;
      memberRole?: MemberRole;
      userAgent: string
      fingerPrintId: string
      geoLocation?: { ip: string | null; country: string | null; countryCode: string | null }
    },
  ): Promise<LoginDeviceStatus> {
    const { settings: appSettings, modules: appModules } = appCache;
    const { memberId, memberRole, userAgent, fingerPrintId, geoLocation } = options;
    
    const uaResult = UAParser(userAgent);
    const { browser, os, device } = uaResult;

    const isLoginRestrictionEnable = appModules.includes('login_restriction');
    const isDeviceManagementEnable = appModules.includes('device_management');
    if (!isLoginRestrictionEnable && !isDeviceManagementEnable) {
      return LoginDeviceStatus.UNSUPPORTED;
    }

    const loginLimit = Number(appSettings['login_device_num']) || 1;
    const deviceLimit = Number(appSettings['bind_device_num']) || 1;

    if (memberRole === 'app-owner') {
      await this.memberInfra.upsertMemberDevice(
        memberId,
        fingerPrintId,
        {
          browser: browser.name,
          osName: os.name,
          ipAddress: geoLocation ? geoLocation.ip : null,
          type: device.type || 'desktop',
          options: { userAgent, geoLocation },
        },
        this.entityManager,
      );
      return LoginDeviceStatus.AVAILABLE;
    }
    
    const memberDevices = await this.memberInfra.getMemberDevices(memberId, this.entityManager);
    const loginedDevices = memberDevices.filter((device) => device.isLogin);

    const isBind = memberDevices.find((device) => device.fingerprintId === fingerPrintId);
    const isLogin = loginedDevices.find((device) => device.fingerprintId === fingerPrintId);

    if (isLogin) {
      await this.memberInfra.upsertMemberDevice(
        memberId,
        fingerPrintId,
        {
          browser: browser.name,
          osName: os.name,
          ipAddress: geoLocation ? geoLocation.ip : null,
          type: device.type || 'desktop',
          options: { userAgent, geoLocation },
        },
        this.entityManager,
      );
      return LoginDeviceStatus.EXISTED;
    }

    if (memberDevices.length >= deviceLimit && isDeviceManagementEnable && !isBind) {
      return LoginDeviceStatus.BIND_LIMIT_EXCEED;
    }

    if (loginedDevices.length >= loginLimit && isLoginRestrictionEnable && !isLogin) {
      return LoginDeviceStatus.LOGIN_LIMIT_EXCEED;
    }

    await this.memberInfra.upsertMemberDevice(
      memberId,
      fingerPrintId,
      {
        browser: browser.name,
        osName: os.name,
        ipAddress: geoLocation ? geoLocation.ip : null,
        type: device.type || 'desktop',
        options: { userAgent, geoLocation },
      },
      this.entityManager,
    );
    return LoginDeviceStatus.AVAILABLE;
  }

  async expireFingerPrintId(fingerprintId: string): Promise<void> {
    const cb = async (manager: EntityManager) => {
      const memberDeviceRepo = manager.getRepository(MemberDevice);
      const device = await memberDeviceRepo.findOneBy({ fingerprintId });
      device.isLogin = false;
      await manager.save(device);
    };
    return cb(this.entityManager);
  }
}
