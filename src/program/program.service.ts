import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

import { ProgramContent } from './entity/program_content.entity';
import { Program } from '~/entity/Program';
import { OrderLog } from '~/order/entity/order_log.entity';
import dayjs from 'dayjs';
import { MemberService } from '~/member/member.service';
import { APIException } from '~/api.excetion';

@Injectable()
export class ProgramService {
  constructor(
    private readonly memberService: MemberService,
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

  async getProgramByMemberId(appId: string, memberId: string) {
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

    const ownedProgramsFromProgramPlan = await this.entityManager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program.id AS id',
        'program.title AS title',
        'program.cover_url AS cover_url',
        'program.cover_mobile_url AS cover_mobile_url',
        'program.abstract AS abstract',
        `JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', program_role.id, 'name', program_role.name, 'member_id', program_role.member_id, 'created_at', program_role.created_at)) AS roles`,
        '(FLOOR((SUM(program_content_progress.progress)/COUNT(program_content.id))::float*100)/100)::numeric AS view_rate',
        'MAX(program_content_progress.updated_at) AS last_viewed_at',
        'MIN(order_product.delivered_at) AS delivered_at',
      ])
      .where(`order_log.member_id = :memberId`, { memberId })
      .innerJoin(
        'order_product',
        'order_product',
        'order_product.delivered_at < NOW()' +
          ' AND order_product.order_id = order_log.id' +
          ' AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW())' +
          ' AND (order_product.started_at IS NULL OR order_product.started_at <= NOW())',
      )
      .innerJoin('product', 'product', 'product.id = order_product.product_id' + ' AND product.type = :productType', {
        productType: 'ProgramPlan',
      })
      .leftJoin('program_plan', 'program_plan', 'program_plan.id::text = product.target')
      .leftJoin('program', 'program', 'program.id = program_plan.program_id')
      .leftJoin('program_role', 'program_role', 'program_role.program_id = program.id')
      .leftJoin('program_content_section', 'program_content_section', 'program_content_section.program_id = program.id')
      .leftJoin(
        'program_content',
        'program_content',
        'program_content.content_section_id = program_content_section.id' +
          ' AND program_content.published_at IS NOT NULL',
      )
      .leftJoin(
        'program_content_progress',
        'program_content_progress',
        'program_content_progress.program_content_id = program_content.id' +
          ' AND program_content_progress.member_id = :memberId',
        { memberId },
      )
      .groupBy('program.id')
      .getRawMany();

    const ownedProgramsDirectly = await this.entityManager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program.id AS id',
        'program.title AS title',
        'program.cover_url AS cover_url',
        'program.cover_mobile_url AS cover_mobile_url',
        'program.abstract AS abstract',
        `JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', program_role.id, 'name', program_role.name, 'member_id', program_role.member_id, 'created_at', program_role.created_at)) AS roles`,
        '(FLOOR((SUM(program_content_progress.progress)/COUNT(program_content.id))::float*100)/100)::numeric AS view_rate',
        'MAX(program_content_progress.updated_at) AS last_viewed_at',
        'MIN(order_product.delivered_at) AS delivered_at',
      ])
      .where(`order_log.member_id = :memberId`, { memberId })
      .innerJoin(
        'order_product',
        'order_product',
        'order_product.delivered_at < NOW()' +
          ' AND order_product.order_id = order_log.id' +
          ' AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW())' +
          ' AND (order_product.started_at IS NULL OR order_product.started_at <= NOW())',
      )
      .innerJoin('product', 'product', 'product.id = order_product.product_id' + ' AND product.type = :productType', {
        productType: 'Program',
      })
      .leftJoin('program', 'program', 'program.id::text = product.target')
      .leftJoin('program_role', 'program_role', 'program_role.program_id = program.id')
      .leftJoin('program_content_section', 'program_content_section', 'program_content_section.program_id = program.id')
      .leftJoin(
        'program_content',
        'program_content',
        'program_content.content_section_id = program_content_section.id' +
          ' AND program_content.published_at IS NOT NULL',
      )
      .leftJoin(
        'program_content_progress',
        'program_content_progress',
        'program_content_progress.program_content_id = program_content.id' +
          ' AND program_content_progress.member_id = :memberId',
        { memberId },
      )
      .groupBy('program.id')
      .getRawMany();

    const assistantPrograms = await this.entityManager
      .getRepository(Program)
      .createQueryBuilder('program')
      .select([
        'program.id AS id',
        'program.title AS title',
        'program.cover_url AS cover_url',
        'program.cover_mobile_url AS cover_mobile_url',
        'program.abstract AS abstract',
        `JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', program_role.id, 'name', program_role.name, 'member_id', program_role.member_id, 'created_at', program_role.created_at)) AS roles`,
        'NULL AS view_rate',
        'NULL AS last_viewed_at',
        'NULL AS delivered_at',
      ])
      .innerJoin(
        'program_role',
        'pr',
        'pr.program_id = program.id' + ' AND pr.member_id = :memberId' + ' AND pr.name = :roleName',
        { memberId, roleName: 'assistant' },
      )
      .leftJoin('program_role', 'program_role', 'program_role.program_id = program.id')
      .groupBy('program.id')
      .getRawMany();

    const programs = [
      ...new Set([
        ...ownedProgramsFromProgramPlan.map((program) => ({
          ...program,
          roles: this.sortProgramRole(program.roles),
        })),
        ...ownedProgramsDirectly.map((program) => ({
          ...program,
          roles: this.sortProgramRole(program.roles),
        })),
        ...assistantPrograms.map((program) => ({
          ...program,
          roles: this.sortProgramRole(program.roles),
        })),
      ]),
    ];

    return programs;
  }

  async getExpiredProgramByMemberId(appId: string, memberId: string) {
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

    const expiredPrograms = await this.entityManager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program.id AS id',
        'program.title AS title',
        'program.cover_url AS cover_url',
        'program.cover_mobile_url AS cover_mobile_url',
        'program.abstract AS abstract',
        `JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', program_role.id, 'name', program_role.name, 'member_id', program_role.member_id, 'created_at', program_role.created_at)) AS roles`,
      ])
      .where(`order_log.member_id = :memberId`, { memberId })
      .andWhere('order_log.status = :orderStatus', { orderStatus: 'SUCCESS' })
      .innerJoin(
        'order_product',
        'order_product',
        'order_product.order_id = order_log.id' +
          ' AND order_product.ended_at IS NOT NULL' +
          ' AND order_product.ended_at < NOW()',
      )
      .innerJoin('product', 'product', 'product.id = order_product.product_id' + ' AND product.type = :productType', {
        productType: 'ProgramPlan',
      })
      .innerJoin('program_plan', 'program_plan', 'program_plan.id::text = product.target')
      .innerJoin('program', 'program', 'program.id = program_plan.program_id')
      .innerJoin('program_role', 'program_role', 'program_role.program_id = program.id')
      .groupBy('program.id')
      .getRawMany();

    const programs = [
      ...new Set([
        ...expiredPrograms.map((program) => ({
          ...program,
          roles: this.sortProgramRole(program.roles),
        })),
      ]),
    ];

    return programs;
  }

  public sortProgramRole(
    roles: { id: string | null; member_id: string | null; name: string | null; created_at: string | null }[],
  ) {
    return roles
      .filter((role) => role.id)
      .sort(
        (a: { created_at: string }, b: { created_at: string }) =>
          dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf(),
      );
  }
}
