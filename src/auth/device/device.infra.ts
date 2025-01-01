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
    const memberDeviceRepo = manager.getRepository(MemberDevice);
    return await memberDeviceRepo.findOneBy({ memberId, fingerprintId });
  }

  async updateMemberLoginStatus(fingerprintId: string, status: boolean, manager: EntityManager): Promise<UpdateResult> {
    const memberDeviceRepo = manager.getRepository(MemberDevice);
    return await memberDeviceRepo.update({ fingerprintId }, { isLogin: status });
  }

  async getMemberDevices(memberId: string, manager: EntityManager): Promise<Array<MemberDevice>> {
    const memberDeviceRepo = manager.getRepository(MemberDevice);
    return await memberDeviceRepo.find({ where: { memberId }, order: { createdAt: 'ASC' } });
  }

  async deleteMemberDeviceById(id: string, manager: EntityManager) {
    const memberDeviceRepo = manager.getRepository(MemberDevice);
    return await memberDeviceRepo.delete({ id });
  }
}
