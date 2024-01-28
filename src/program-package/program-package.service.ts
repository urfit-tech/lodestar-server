import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

import { OrderLog } from '~/order/entity/order_log.entity';
import { MemberService } from '~/member/member.service';
import { APIException } from '~/api.excetion';
import { ProgramPackageInfrastructure } from './program-package.infra';
import { ProgramPackageProgramContentProgressDTO, ProgramTempoDeliveryDTO } from './program-package.dto';
import { isEmpty } from 'lodash';
import { ProgramInfrastructure } from '~/program/program.infra';

@Injectable()
export class ProgramPackageService {
  constructor(
    private readonly memberService: MemberService,
    private readonly programPackageInfra: ProgramPackageInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly programInfra: ProgramInfrastructure,
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

    return [
      ...new Set(
        ownedProgramPackages.map((programPackage) => ({
          ...programPackage,
          viewRate: Number(programPackage.viewRate || 0),
        })),
      ),
    ];
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

    return [
      ...new Set(
        expiredProgramPackages.map((programPackage) => ({
          ...programPackage,
          viewRate: Number(programPackage.viewRate || 0),
        })),
      ),
    ];
  }

  public async getEnrolledProgramPackageById(appId: string, memberId: string, programPackageId: string) {
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

    const ownedProgramPackages = await this.programPackageInfra.getEnrolledProgramPackageById(
      memberId,
      programPackageId,
      this.entityManager,
    );

    const filterProgramContentProgress = ownedProgramPackages.isTempoDelivery
      ? this.filterProgramContentProgressNotTempoDelivered(
          ownedProgramPackages.programContentProgress,
          ownedProgramPackages.programTempoDelivery.filter((delivery) => !isEmpty(delivery)),
        )
      : ownedProgramPackages.programContentProgress;

    const programCategories = await this.programInfra.getProgramCategories(
      filterProgramContentProgress.map((p: ProgramPackageProgramContentProgressDTO) => p.programId),
      this.entityManager,
    );

    const progress = await this.calculateProgramPackageProgramProgress(filterProgramContentProgress);

    return {
      id: ownedProgramPackages.id,
      title: ownedProgramPackages.title,
      coverUrl: ownedProgramPackages.coverUrl,
      programs: [
        ...new Set(filterProgramContentProgress.sort((a, b) => a.position - b.position).map((p) => p.programId)),
      ].map((programId: string) => ({
        id: programId,
        title: filterProgramContentProgress.find((p) => p.programId === programId).programTitle || '',
        coverUrl: filterProgramContentProgress.find((p) => p.programId === programId).programCoverUrl || null,
        viewRate: progress[programId],
        categories:
          programCategories
            .find((pc) => pc.id === programId)
            ?.programCategories.map((programCategory) => ({
              id: programCategory.category.id,
              name: programCategory.category.name,
              position: programCategory.category.position,
            })) || [],
      })),
    };
  }

  private filterProgramContentProgressNotTempoDelivered(
    programContentProgress: ProgramPackageProgramContentProgressDTO[],
    programTempoDelivery: ProgramTempoDeliveryDTO[],
  ) {
    return programContentProgress.filter((progress) =>
      programTempoDelivery.some(
        (delivery) =>
          delivery.programPackageProgramId === progress.programPackageProgramId &&
          new Date(delivery.deliveredAt).getTime() < Date.now(),
      ),
    );
  }

  private async calculateProgramPackageProgramProgress(
    programContentProgress: ProgramPackageProgramContentProgressDTO[],
  ) {
    const progressSummary = programContentProgress.reduce((acc, item) => {
      if (!acc[item.programId]) {
        acc[item.programId] = { sum: 0, count: 0 };
      }

      acc[item.programId].sum += item.progress;
      acc[item.programId].count += 1;

      return acc;
    }, {});

    const averageProgress = {};

    for (const id in progressSummary) {
      if (progressSummary[id].count > 0) {
        averageProgress[id] = Math.floor((progressSummary[id].sum / progressSummary[id].count) * 100) / 100;
      } else {
        averageProgress[id] = null;
      }
    }

    return averageProgress;
  }
}
