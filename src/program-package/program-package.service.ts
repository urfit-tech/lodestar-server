import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

import { OrderLog } from '~/order/entity/order_log.entity';
import { MemberService } from '~/member/member.service';
import { APIException } from '~/api.excetion';
import { ProgramPackageInfrastructure } from './program-package.infra';

@Injectable()
export class ProgramPackageService {
  constructor(
    private readonly memberService: MemberService,
    private readonly programPackageInfra: ProgramPackageInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  public async getProgramPackageByMemberId(appId: string, memberId: string) {
    // Todo: check permission
    // ...

    const { data: memberData } = await this.memberService.getMembersByCondition(appId, { limit: 1 }, { id: memberId });
    if (memberData.length === 0) {
      throw new APIException({
        code: 'E_NO_MEMBER',
        message: 'member not found',
        result: null,
      });
    }

    const ownedProgramPackages = await this.programPackageInfra.getOwnedProgramPackages(memberId, this.entityManager);

    return [...new Set(ownedProgramPackages)];
  }

  public async getExpiredProgramPackageByMemberId(appId: string, memberId: string) {
    // Todo: check permission
    // ...

    const { data: memberData } = await this.memberService.getMembersByCondition(appId, { limit: 1 }, { id: memberId });
    if (memberData.length === 0) {
      throw new APIException({
        code: 'E_NO_MEMBER',
        message: 'member not found',
        result: null,
      });
    }

    const expiredProgramPackages = await this.programPackageInfra.getExpiredProgramPackages(
      memberId,
      this.entityManager,
    );

    return [...new Set(expiredProgramPackages)];
  }
}
