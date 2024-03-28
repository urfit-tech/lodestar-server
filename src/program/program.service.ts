import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ProgramContent } from './entity/program_content.entity';
import dayjs from 'dayjs';
import { MemberService } from '~/member/member.service';
import { APIException } from '~/api.excetion';
import { ProgramInfrastructure } from './program.infra';
import { OwnedProgram } from './program.type';
import { groupBy, sum, uniq, uniqBy } from 'lodash';

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

  public async getProgramContentById(id: string): Promise<ProgramContent> {
    const programContentRepo = this.entityManager.getRepository(ProgramContent);
    return programContentRepo.findOne({
      where: { id },
      relations: ['contentSection', 'contentSection.program'],
    });
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

    const ownedProgramsFromProgramPlan = await this.programInfra
      .getOwnedProgramsFromProgramPlan(memberId, this.entityManager)
      .then((ownedProgramDirectlyDataList: OwnedProgram[]) => {
        const uniqRoles = uniqBy(
          ownedProgramDirectlyDataList.map((ownedProgramDirectlyData) => {
            return {
              id: ownedProgramDirectlyData.programRoleId,
              name: ownedProgramDirectlyData.programRoleName,
              memberId: ownedProgramDirectlyData.programRoleMemberId,
              memberName: ownedProgramDirectlyData.programRoleMemberName,
              createdAt: ownedProgramDirectlyData.programRoleCreatedAt,
              programId: ownedProgramDirectlyData.id,
            };
          }),
          (role) => role.id,
        );

        const deliveredAtList = groupBy(
          ownedProgramDirectlyDataList.map((ownedProgramDirectlyData) => ({
            programId: ownedProgramDirectlyData.id,
            deliveredAt: ownedProgramDirectlyData.deliveredAt,
          })),
          'programId',
        );
        const programDeliveredAtList = uniq(
          ownedProgramDirectlyDataList.map((ownedProgramDirectlyData) => ownedProgramDirectlyData.id),
        ).map((programId) => ({
          id: programId,
          deliveredAt: new Date(Math.min(...deliveredAtList[programId].map((v) => new Date(v.deliveredAt).getTime()))),
        }));

        const programContents = uniq(
          ownedProgramDirectlyDataList.map((ownedProgramDirectlyData) => ({
            programId: ownedProgramDirectlyData.id,
            programContentId: ownedProgramDirectlyData.programContentId,
          })),
        ).map((programData) => {
          const programContentDataList = ownedProgramDirectlyDataList.filter(
            (ownedProgramDirectlyData) => ownedProgramDirectlyData.programContentId === programData.programContentId,
          );

          const programContentId = programData.programContentId;

          if (programContentDataList.length === 0)
            return {
              programId: programData.programId,
              programContentId: programData.programContentId,
              progress: 0,
              lastViewedAt: null,
            };

          const programContentType = programContentDataList[0].programContentType;
          if (programContentType === 'exam' || programContentType === 'exercise') {
            const hasExamExercise =
              programContentDataList.filter((programContentData) => programContentData.exerciseUpdatedAt).length > 0;

            // sort by exerciseUpdatedAt
            programContentDataList.sort(
              (a, b) => new Date(b.exerciseUpdatedAt).getTime() - new Date(a.exerciseUpdatedAt).getTime(),
            );
            const passingScore = programContentDataList[0].passingScore;
            const gainedPoints = programContentDataList[0].gainedPoints;
            return {
              programId: programData.programId,
              programContentId,
              progress: hasExamExercise ? (gainedPoints >= passingScore ? 1 : 0.5) : 0,
              lastViewedAt: hasExamExercise ? programContentDataList[0].exerciseUpdatedAt : null,
            };
          } else if (programContentType === 'ebook') {
            const hasEbookTocProgress =
              programContentDataList.filter((programContent) => programContent.ebookTocProgressUpdatedAt).length > 0;
            return {
              programId: programData.programId,
              programContentId,
              progress: hasEbookTocProgress
                ? sum(
                    programContentDataList.map((programContentData) =>
                      programContentData.ebookTocProgressFinishedAt ? 1 : 0,
                    ),
                  ) / programContentDataList.length
                : 0,
              lastViewedAt: hasEbookTocProgress
                ? new Date(
                    Math.max(
                      ...programContentDataList.map((programContentData) =>
                        new Date(programContentData.ebookTocProgressUpdatedAt).getTime(),
                      ),
                    ),
                  )
                : null,
            };
          } else if (programContentType === 'practice') {
            const hasPractice =
              programContentDataList.filter((programContentData) => !!programContentData.practiceId).length > 0;
            return {
              programId: programData.programId,
              programContentId,
              progress: hasPractice ? 1 : 0,
              lastViewedAt: hasPractice
                ? new Date(
                    Math.max(
                      ...programContentDataList.map((programContentData) =>
                        new Date(programContentData.practiceUpdatedAt).getTime(),
                      ),
                    ),
                  )
                : null,
            };
          } else {
            // video, text, audio
            return {
              programId: programData.programId,
              programContentId,
              progress: Number(programContentDataList?.[0].progress) || 0,
              lastViewedAt: programContentDataList?.[0].viewedAt || null,
            };
          }
        });

        return [
          ...uniqBy(ownedProgramDirectlyDataList, (ownedProgramDirectlyData) => ownedProgramDirectlyData.id).map(
            (ownedProgramDirectlyData) => {
              const currentProgramProgramContents = uniqBy(
                programContents.filter((programContent) => programContent.programId === ownedProgramDirectlyData.id),
                'programContentId',
              );
              return {
                ...ownedProgramDirectlyData,
                roles: this.sortProgramRole(
                  uniqRoles.filter((uniqRole) => uniqRole.programId === ownedProgramDirectlyData.id),
                ),
                viewRate:
                  currentProgramProgramContents.length > 0
                    ? sum(currentProgramProgramContents.map((programContent) => programContent.progress)) /
                      currentProgramProgramContents.length
                    : 0,
                lastViewedAt:
                  currentProgramProgramContents.filter((programContent) => !!programContent.lastViewedAt).length > 0
                    ? new Date(
                        Math.max(
                          ...programContents
                            .filter((programContent) => programContent.programId === ownedProgramDirectlyData.id)
                            .map((programContent) => new Date(programContent.lastViewedAt).getTime()),
                        ),
                      )
                    : null,
                deliveredAt: programDeliveredAtList.find(
                  (programDeliveredAt) => programDeliveredAt.id === ownedProgramDirectlyData.id,
                ).deliveredAt,
              };
            },
          ),
        ];
      });

    const ownedProgramDirectly = await this.programInfra.getOwnedProgramsDirectly(memberId, this.entityManager);

    const programWithRoleIsAssistant = await this.programInfra.getProgramsWithRoleIsAssistant(
      memberId,
      this.entityManager,
    );

    return [
      ...new Set([
        ...ownedProgramDirectly.map((program) => {
          return {
            ...program,
            viewRate: Number(program.viewRate || 0),
            roles: this.sortProgramRole(program.roles),
          };
        }),
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

  private sortProgramRole(roles: { memberId: string; name: string; createdAt: string }[]) {
    return roles.sort(
      (a: { createdAt: string }, b: { createdAt: string }) =>
        dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    );
  }
}
