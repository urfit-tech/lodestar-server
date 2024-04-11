import { EntityManager, In } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ProgramContent } from './entity/program_content.entity';
import dayjs from 'dayjs';
import { MemberService } from '~/member/member.service';
import { APIException } from '~/api.excetion';
import { ProgramInfrastructure } from './program.infra';
import { ProgramContentLog } from '~/program/entity/ProgramContentLog';
import { validate as uuidValidate } from 'uuid';

@Injectable()
export class ProgramService {
  constructor(
    private readonly memberService: MemberService,
    private readonly programInfra: ProgramInfrastructure,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  public async getProgramContentByAttachmentId(attachmentId: string): Promise<Array<ProgramContent>> {
    const programContentRepo = this.entityManager.getRepository(ProgramContent);
    return programContentRepo.findBy({
      programContentVideos: {
        attachment: { id: attachmentId },
      },
    });
  }

  private _mergeProgramPlans(primaryPlans: Record<string, any>[], secondaryPlans: Record<string, any>[]) {
    const mergedProgramPlanIds = new Map();
    primaryPlans.forEach((plan) => mergedProgramPlanIds.set(plan.id, plan));
    secondaryPlans.forEach((plan) => mergedProgramPlanIds.set(plan.id, plan));
    return Array.from(mergedProgramPlanIds.values());
  }

  public async getProgramByMemberId(appId: string, memberId: string) {
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

    const ownedProgramDirectly = await this.programInfra.getOwnedProgramsDirectly(memberId, this.entityManager);

    const ownedProgramsFromProgramPlan = await this.programInfra.getOwnedProgramsFromProgramPlan(
      memberId,
      this.entityManager,
    );

    const ownedProgramsFromCard = await this.programInfra.getOwnedProgramsFromCard(memberId, this.entityManager);

    const ownedProgramPlans = this._mergeProgramPlans(ownedProgramsFromCard, ownedProgramsFromProgramPlan);

    const programWithRoleIsAssistant = await this.programInfra.getProgramsWithRoleIsAssistant(
      memberId,
      this.entityManager,
    );

    return [
      ...new Set([
        ...ownedProgramDirectly.map((program) => ({
          ...program,
          viewRate: Number(program.viewRate || 0),
          roles: this.sortProgramRole(program.roles),
        })),
        ...programWithRoleIsAssistant.map((program) => ({
          ...program,
          viewRate: Number(program.viewRate || 0),
          roles: this.sortProgramRole(program.roles),
        })),

        ...ownedProgramPlans.map((program) => ({
          ...program,
          viewRate: Number(program.viewRate || 0),
          roles: this.sortProgramRole(program.roles),
        })),
      ]),
    ];
  }

  public async getExpiredProgramByMemberId(appId: string, memberId: string) {
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

    const expiredPrograms = await this.programInfra.getExpiredPrograms(memberId, this.entityManager);

    return [
      ...new Set([
        ...expiredPrograms.map((program) => ({
          ...program,
          viewRate: Number(program.viewRate || 0),
          roles: this.sortProgramRole(program.roles),
        })),
      ]),
    ];
  }

  public sortProgramRole(roles: { id: string; member_id: string; name: string; createdAt: string }[]) {
    return roles
      .filter((role) => role.id)
      .sort(
        (a: { createdAt: string }, b: { createdAt: string }) =>
          dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
      );
  }
}
