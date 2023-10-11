import { Injectable } from '@nestjs/common';
import { EntityManager, UpdateResult } from 'typeorm';

import { MemberDevice } from '~/member/entity/member_device.entity';

@Injectable()
export class DeviceInfrastructure {
  async getDeviceByMemberIdAndFingerprintId(
    memberId: string,
    fingerprintId: string,
    manager: EntityManager,
  ): Promise<MemberDevice> {
    const deviceRepo = manager.getRepository(MemberDevice);
    return deviceRepo.findOneBy({ memberId, fingerprintId });
  }

  async updateMemberLoginStatus(
    fingerprintId: string,
    status: boolean,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    const memberRepo = manager.getRepository(MemberDevice);
    return memberRepo.update({ fingerprintId }, { isLogin: status });
  }
}
