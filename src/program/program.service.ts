import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ProgramContent } from './entity/program_content.entity';
import dayjs from 'dayjs';
import { MemberService } from '~/member/member.service';
import { APIException } from '~/api.excetion';
import { ProgramInfrastructure } from './program.infra';
import { ProgramResponseDTO } from './program.dto';

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

  public async getProgramContentById(programContentId: string) {
    return this.programInfra.getProgramContentById(programContentId, this.entityManager);
  }

  public async getTrialProgramContent(programContentId: string) {
    return this.programInfra.getTrialProgramContent(programContentId, this.entityManager);
  }

  public async getLoginToTrialProgramContent(programContentId: string) {
    return this.programInfra.getLoginToTrialProgramContent(programContentId, this.entityManager);
  }

  public async getProgramsByMemberId(appId: string, memberId: string) {
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
        ...ownedProgramsFromProgramPlan.map((program) => ({
          ...program,
          viewRate: Number(program.viewRate || 0),
          roles: this.sortProgramRole(program.roles),
        })),
        ...programWithRoleIsAssistant.map((program) => ({
          ...program,
          viewRate: Number(program.viewRate || 0),
          roles: this.sortProgramRole(program.roles),
        })),
      ]),
    ];
  }

  public async getProgramByMemberId(memberId: string, programId: string, permissionId: string) {
    let programByProgramPlanEnrollment: ProgramResponseDTO;
    let programByProgramEnrollment: ProgramResponseDTO;
    let programByProgramRoleAndPermission: ProgramResponseDTO;
    let programByProgramPackageEnrollment: ProgramResponseDTO;

    Promise.all([
      (programByProgramPlanEnrollment = await this.programInfra.getProgramByProgramPlanEnrollment(
        memberId,
        programId,
        this.entityManager,
      )),
      (programByProgramEnrollment = await this.programInfra.getProgramByProgramEnrollment(
        memberId,
        programId,
        this.entityManager,
      )),
      (programByProgramRoleAndPermission = await this.programInfra.getProgramByProgramRoleAndPermission(
        memberId,
        programId,
        permissionId,
        this.entityManager,
      )),
      (programByProgramPackageEnrollment = await this.programInfra.getProgramByProgramPackageEnrollment(
        memberId,
        programId,
        this.entityManager,
      )),
    ]);

    const program = {
      ...programByProgramPlanEnrollment,
      ...programByProgramEnrollment,
      ...programByProgramRoleAndPermission,
      ...programByProgramPackageEnrollment,
    };
    return Object.keys(program).length !== 0 ? program : undefined;
  }

  public async getProgramByProgramId(programId: string) {
    const programByProgramId = await this.programInfra.getProgramByProgramId(programId, this.entityManager);
    return programByProgramId;
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

  public async getEnrolledProgramContentById(
    appId: string,
    memberId: string,
    programId: string,
    programContentId: string,
    permissionId: string,
  ) {
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

    const enrolledProgramContentId = await this.programInfra.getEnrolledProgramContentById(
      memberId,
      programId,
      programContentId,
      this.entityManager,
      permissionId,
    );

    return enrolledProgramContentId;
  }

  public async getEnrolledProgramContentsByProgramId(
    appId: string,
    memberId: string,
    programId: string,
    permissionId: string,
  ) {
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

    const enrolledProgramContents = await this.programInfra.getEnrolledProgramContentsByProgramId(
      memberId,
      programId,
      this.entityManager,
      permissionId,
    );

    return enrolledProgramContents;
  }

  public async getProgramContentsByProgramId(appId: string, programId: string) {
    return await this.programInfra.getProgramContentsByProgramId(programId, this.entityManager);
  }

  public async getProgramContentMaterialsByProgramId(programId: string) {
    const programContentMaterialsByProgramId = await this.programInfra.getProgramContentMaterialsByProgramId(
      programId,
      this.entityManager,
    );

    return programContentMaterialsByProgramId;
  }

  private sortProgramRole(roles: { memberId: string; name: string; createdAt: string }[]) {
    return roles.sort(
      (a: { createdAt: string }, b: { createdAt: string }) =>
        dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    );
  }
}
