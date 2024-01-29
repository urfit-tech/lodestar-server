import { Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { Program } from '~/entity/Program';
import { OrderLog } from '~/order/entity/order_log.entity';
import { UtilityService } from '~/utility/utility.service';
import { ProgramContent } from './entity/program_content.entity';
import { ProgramContentLog } from '~/program/entity/ProgramContentLog';

@Injectable()
export class ProgramInfrastructure {
  constructor(private readonly utilityService: UtilityService) {}

  async getOwnedProgramsFromProgramPlan(memberId: string, manager: EntityManager) {
    const programs = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program.id AS id',
        'program.title AS title',
        'program.cover_url AS cover_url',
        'program.cover_mobile_url AS cover_mobile_url',
        'program.cover_thumbnail_url AS cover_thumbnail_url',
        'program.abstract AS abstract',
        `JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', program_role.id, 'name', program_role.name, 'member_id', member.id,'member_name', member.name, 'created_at', program_role.created_at)) AS roles`,
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
      .innerJoin('product', 'product', 'product.id = order_product.product_id' + ` AND product.type = :productType`, {
        productType: 'ProgramPlan',
      })
      .leftJoin('program_plan', 'program_plan', 'program_plan.id::text = product.target')
      .leftJoin('program', 'program', 'program.id = program_plan.program_id')
      .leftJoin('program_role', 'program_role', 'program_role.program_id = program.id')
      .leftJoin('member', 'member', 'member.id = program_role.member_id')
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

    return this.utilityService.convertObjectKeysToCamelCase(programs);
  }

  async getOwnedProgramsDirectly(memberId: string, manager: EntityManager) {
    const programs = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program.id AS id',
        'program.title AS title',
        'program.cover_url AS cover_url',
        'program.cover_mobile_url AS cover_mobile_url',
        'program.cover_thumbnail_url AS cover_thumbnail_url',
        'program.abstract AS abstract',
        `JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', program_role.id, 'name', program_role.name, 'member_id', member.id,'member_name', member.name, 'created_at', program_role.created_at)) AS roles`,
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
      .innerJoin('product', 'product', 'product.id = order_product.product_id' + ` AND product.type = :productType`, {
        productType: 'Program',
      })
      .leftJoin('program', 'program', 'program.id::text = product.target')
      .leftJoin('program_role', 'program_role', 'program_role.program_id = program.id')
      .leftJoin('member', 'member', 'member.id = program_role.member_id')
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
    return this.utilityService.convertObjectKeysToCamelCase(programs);
  }

  async getProgramsWithRoleIsAssistant(memberId: string, manager: EntityManager) {
    const programs = await manager
      .getRepository(Program)
      .createQueryBuilder('program')
      .select([
        'program.id AS id',
        'program.title AS title',
        'program.cover_url AS cover_url',
        'program.cover_mobile_url AS cover_mobile_url',
        'program.cover_thumbnail_url AS cover_thumbnail_url',
        'program.abstract AS abstract',
        `JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', program_role.id, 'name', program_role.name, 'member_id', member.id,'member_name', member.name, 'created_at', program_role.created_at)) AS roles`,
        'NULL AS view_rate',
        'NULL AS last_viewed_at',
        'NULL AS delivered_at',
      ])
      .innerJoin(
        'program_role',
        'pr',
        'pr.program_id = program.id' + ' AND pr.member_id = :memberId' + ` AND pr.name = :role`,
        { memberId, role: 'assistant' },
      )
      .leftJoin('program_role', 'program_role', 'program_role.program_id = program.id')
      .leftJoin('member', 'member', 'member.id = program_role.member_id')
      .groupBy('program.id')
      .getRawMany();

    return this.utilityService.convertObjectKeysToCamelCase(programs);
  }

  async getExpiredPrograms(memberId: string, manager: EntityManager) {
    const programs = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program.id AS id',
        'program.title AS title',
        'program.cover_url AS cover_url',
        'program.cover_mobile_url AS cover_mobile_url',
        'program.cover_thumbnail_url AS cover_thumbnail_url',
        'program.abstract AS abstract',
        `JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', program_role.id, 'name', program_role.name, 'member_id', member.id,'member_name', member.name, 'created_at', program_role.created_at)) AS roles`,
        '(FLOOR((SUM(program_content_progress.progress)/COUNT(program_content.id))::float*100)/100)::numeric AS view_rate',
        'MAX(program_content_progress.updated_at) AS last_viewed_at',
        'MIN(order_product.delivered_at) AS delivered_at',
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
      .leftJoin('member', 'member', 'member.id = program_role.member_id')
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

    return this.utilityService.convertObjectKeysToCamelCase(programs);
  }

  async findProgramContentById(id: string, entityManager: EntityManager): Promise<ProgramContent | null> {
    const programContentRepo = entityManager.getRepository(ProgramContent);
    return programContentRepo.findOneBy({ id });
  }

  async saveProgramContentLogs(programContentLogs: ProgramContentLog[], entityManager: EntityManager): Promise<void> {
    await entityManager.save(ProgramContentLog, programContentLogs);
  }

  async getEnrolledProgramContentById(
    memberId: string,
    programId: string,
    programContentId: string,
    manager: EntityManager,
  ) {
    const programContentIdByProgramEnrollment = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select(['program_content.id AS program_content_id'])
      .where(`order_log.member_id = :memberId`, { memberId })
      .andWhere('program_content.id = :programContentId', { programContentId })
      .innerJoin(
        'order_product',
        'order_product',
        'order_product.delivered_at < NOW()' +
          ' AND order_product.order_id = order_log.id' +
          ' AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW())' +
          ' AND (order_product.started_at IS NULL OR order_product.started_at <= NOW())',
      )
      .innerJoin(
        'product',
        'product',
        'product.id = order_product.product_id' +
          ` AND product.type = :productType` +
          ' AND product.target = :programId',
        {
          productType: 'Program',
          programId,
        },
      )
      .leftJoin('program', 'program', 'program.id::text = product.target')
      .leftJoin('program_content_section', 'program_content_section', 'program_content_section.program_id = program.id')
      .innerJoin(
        'program_content',
        'program_content',
        'program_content.content_section_id = program_content_section.id' +
          ' AND program_content.published_at IS NOT NULL' +
          ' AND program_content.id = :programContentId',
        { programContentId },
      )
      .getRawOne();

    const programContentIdByProgramRole = await manager
      .getRepository(ProgramContent)
      .createQueryBuilder('program_content')
      .select(['program_content.id AS program_content_id'])
      .where('program_content.id = :programContentId', { programContentId })
      .leftJoin(
        'program_content_section',
        'program_content_section',
        'program_content_section.id = program_content.content_section_id',
      )
      .leftJoin(
        'program',
        'program',
        'program.id = program_content_section.program_id' + ' AND program.id = :programId',
        { programId },
      )
      .innerJoin(
        'program_role',
        'program_role',
        'program_role.program_id = program.id' +
          ' AND program_role.member_id = :memberId' +
          ` AND ( program_role.name = :role1 OR program_role.name = :role2)`,
        { memberId, role1: 'assistant', role2: 'instructor' },
      )
      .getRawOne();

    const programContentIdByProgramPlanEnrollmentSubcribedFromNowOrAll = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select(['program_content.id AS program_content_id'])
      .where(`order_log.member_id = :memberId`, { memberId })
      .andWhere(
        `((program_plan.type = 1 AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW()) AND (order_product.started_at IS NULL OR order_product.started_at <= NOW())) OR (program_plan.type = 2 AND program_content.published_at > order_product.delivered_at AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW()) AND (order_product.started_at IS NULL OR order_product.started_at <= NOW())))`,
      )
      .innerJoin(
        'order_product',
        'order_product',
        'order_product.delivered_at < NOW()' +
          ' AND order_product.order_id = order_log.id' +
          ' AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW())' +
          ' AND (order_product.started_at IS NULL OR order_product.started_at <= NOW())',
      )
      .innerJoin('product', 'product', 'product.id = order_product.product_id' + ` AND product.type = :productType`, {
        productType: 'ProgramPlan',
      })
      .leftJoin('program_plan', 'program_plan', 'program_plan.id::text = product.target')
      .innerJoin(
        'program_content_plan',
        'program_content_plan',
        'program_content_plan.program_plan_id = program_plan.id' +
          ' AND program_content_plan.program_content_id = :programContentId',
        { programContentId },
      )
      .leftJoin('program_content', 'program_content', 'program_content.id = program_content_plan.program_content_id')
      .getRawOne();

    const programContentIdByProgramPlanEnrollment = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select(['program_content.id AS program_content_id'])
      .where(`order_log.member_id = :memberId`, { memberId })
      .innerJoin(
        'order_product',
        'order_product',
        'order_product.delivered_at < NOW()' +
          ' AND order_product.order_id = order_log.id' +
          ' AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW())' +
          ' AND (order_product.started_at IS NULL OR order_product.started_at <= NOW())',
      )
      .innerJoin('product', 'product', 'product.id = order_product.product_id' + ` AND product.type = :productType`, {
        productType: 'ProgramPlan',
      })
      .leftJoin('program_plan', 'program_plan', 'program_plan.id::text = product.target' + ' AND program_plan.type = 3')
      .leftJoin(
        'program_content_section',
        'program_content_section',
        'program_content_section.program_id = program_plan.program_id',
      )
      .innerJoin(
        'program_content',
        'program_content',
        'program_content.content_section_id = program_content_section.id' +
          ' AND program_content.id = :programContentId',
        { programContentId },
      )
      .getRawOne();

    const programContentIdByProgramPackageEnrollment = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select(['program_content.id AS program_content_id'])
      .where(`order_log.member_id = :memberId`, { memberId })
      .andWhere(`(program_package_plan.is_tempo_delivery = false OR ( program_tempo_delivery.delivered_at < NOW() ))`)
      .innerJoin(
        'order_product',
        'order_product',
        'order_product.delivered_at < NOW()' +
          ' AND order_product.order_id = order_log.id' +
          ' AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW())' +
          ' AND (order_product.started_at IS NULL OR order_product.started_at <= NOW())',
      )
      .innerJoin('product', 'product', 'product.id = order_product.product_id' + ' AND product.type = :productType', {
        productType: 'ProgramPackagePlan',
      })
      .leftJoin('program_package_plan', 'program_package_plan', 'program_package_plan.id::text = product.target')
      .leftJoin('program_package', 'program_package', 'program_package.id = program_package_plan.program_package_id')
      .leftJoin(
        'program_package_program',
        'program_package_program',
        'program_package_program.program_package_id = program_package.id' +
          ' AND program_package_program.program_id = :programId',
        { programId },
      )
      .leftJoin('program', 'program', 'program.id = program_package_program.program_id')
      .leftJoin('program_content_section', 'program_content_section', 'program_content_section.program_id = program.id')
      .innerJoin(
        'program_content',
        'program_content',
        'program_content.content_section_id = program_content_section.id' +
          ' AND program_content.id = :programContentId',
        { programContentId },
      )
      .leftJoin(
        'program_tempo_delivery',
        'program_tempo_delivery',
        'program_tempo_delivery.program_package_program_id = program_package_program.id' +
          ' AND program_tempo_delivery.member_id = :memberId',
        {
          memberId,
        },
      )
      .getRawOne();

    return this.utilityService.convertObjectKeysToCamelCase({
      ...programContentIdByProgramEnrollment,
      ...programContentIdByProgramRole,
      ...programContentIdByProgramPlanEnrollmentSubcribedFromNowOrAll,
      ...programContentIdByProgramPlanEnrollment,
      ...programContentIdByProgramPackageEnrollment,
    });
  }

  async getProgramCategories(programIds: string[], entityManager: EntityManager) {
    const programRepo = entityManager.getRepository(Program);
    return programRepo.find({
      where: { id: In(programIds) },
      relations: { programCategories: { category: true } },
      select: {
        id: true,
        programCategories: {
          id: true,
          category: {
            id: true,
            name: true,
            position: true,
          },
        },
      },
    });
  }
}
