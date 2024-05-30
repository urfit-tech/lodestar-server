import { Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { Program } from '~/entity/Program';
import { OrderLog } from '~/order/entity/order_log.entity';
import { UtilityService } from '~/utility/utility.service';
import { ProgramContent } from './entity/program_content.entity';
import { ProgramContentLog } from '~/program/entity/ProgramContentLog';
import { ProgramContentMaterial } from '~/entity/ProgramContentMaterial';
import { ProgramContentAudio } from '~/entity/ProgramContentAudio';
import { ProgramContentVideo } from '~/entity/ProgramContentVideo';
import { Attachment } from '~/media/attachment.entity';
import { ProgramContentBody } from '~/entity/ProgramContentBody';

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

  async getOwnedProgramsFromMembershipCardEnrollment(memberId: string, manager: EntityManager) {
    const ownerProgramsFromMembershipCardEnrollment = await manager
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
        productType: 'Card',
      })
      .innerJoin('program_plan', 'program_plan', 'program_plan.card_id::text = product.target')
      .innerJoin('program', 'program', 'program.id = program_plan.program_id')
      .innerJoin('program_role', 'program_role', 'program_role.program_id = program.id')
      .innerJoin('member', 'member', 'member.id = program_role.member_id')
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

    return this.utilityService.convertObjectKeysToCamelCase(ownerProgramsFromMembershipCardEnrollment);
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

  async getProgramByProgramPlanEnrollment(memberId: string, programId: string, manager: EntityManager) {
    const programByProgramPlanEnrollment = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program.id AS id',
        'program.title AS title',
        'program.cover_url AS cover_url',
        'program.cover_mobile_url AS cover_mobile_url',
        'program.cover_thumbnail_url AS cover_thumbnail_url',
        'program.abstract AS abstract',
      ])
      .where(`order_log.member_id = :memberId`, { memberId })
      .andWhere(`program.id = :programId`, { programId })
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
      .leftJoin('program_content_section', 'program_content_section', 'program_content_section.program_id = program.id')
      .leftJoin(
        'program_content',
        'program_content',
        'program_content.content_section_id = program_content_section.id' +
          ' AND program_content.published_at IS NOT NULL',
      )
      .getRawOne();

    return this.utilityService.convertObjectKeysToCamelCase(programByProgramPlanEnrollment);
  }

  async getProgramByMembershipCardEnrollment(memberId: string, programId: string, manager: EntityManager) {
    const programByMembershipCardEnrollment = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program.id AS id',
        'program.title AS title',
        'program.cover_url AS cover_url',
        'program.cover_mobile_url AS cover_mobile_url',
        'program.cover_thumbnail_url AS cover_thumbnail_url',
        'program.abstract AS abstract',
      ])
      .where(`order_log.member_id = :memberId`, { memberId })
      .andWhere(`program.id = :programId`, { programId })
      .innerJoin(
        'order_product',
        'order_product',
        'order_product.delivered_at < NOW()' +
          ' AND order_product.order_id = order_log.id' +
          ' AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW())' +
          ' AND (order_product.started_at IS NULL OR order_product.started_at <= NOW())',
      )
      .innerJoin('product', 'product', 'product.id = order_product.product_id' + ` AND product.type = :productType`, {
        productType: 'Card',
      })
      .innerJoin('program_plan', 'program_plan', 'program_plan.card_id::text = product.target')
      .innerJoin('program', 'program', 'program.id = program_plan.program_id')
      .leftJoin('program_content_section', 'program_content_section', 'program_content_section.program_id = program.id')
      .leftJoin(
        'program_content',
        'program_content',
        'program_content.content_section_id = program_content_section.id' +
          ' AND program_content.published_at IS NOT NULL',
      )
      .getRawOne();

    return this.utilityService.convertObjectKeysToCamelCase(programByMembershipCardEnrollment);
  }

  async getProgramByProgramEnrollment(memberId: string, programId: string, manager: EntityManager) {
    const programByProgramEnrollment = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program.id AS id',
        'program.title AS title',
        'program.cover_url AS cover_url',
        'program.cover_mobile_url AS cover_mobile_url',
        'program.cover_thumbnail_url AS cover_thumbnail_url',
        'program.abstract AS abstract',
      ])
      .where(`order_log.member_id = :memberId`, { memberId })
      .andWhere(`program.id = :programId`, { programId })
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
      .leftJoin('program_content_section', 'program_content_section', 'program_content_section.program_id = program.id')
      .leftJoin(
        'program_content',
        'program_content',
        'program_content.content_section_id = program_content_section.id' +
          ' AND program_content.published_at IS NOT NULL',
      )
      .getRawOne();

    return this.utilityService.convertObjectKeysToCamelCase(programByProgramEnrollment);
  }

  async getProgramByProgramRoleAndPermission(
    memberId: string,
    programId: string,
    permissionId: string,
    manager: EntityManager,
  ) {
    const programByProgramRoleAndPermission = await manager
      .getRepository(Program)
      .createQueryBuilder('program')
      .select([
        'program.id AS id',
        'program.title AS title',
        'program.cover_url AS cover_url',
        'program.cover_mobile_url AS cover_mobile_url',
        'program.cover_thumbnail_url AS cover_thumbnail_url',
        'program.abstract AS abstract',
      ])
      .where(`program.id = :programId`, { programId })
      .innerJoin(
        'program_role',
        'program_role',
        'program_role.program_id = program.id' +
          ' AND program_role.member_id = :memberId' +
          ` AND program_role.name IN(:...roles)`,
        { memberId, roles: ['owner', 'instructor'] },
      )
      .innerJoin(
        'member_permission',
        'member_permission',
        'member_permission.member_id = program_role.member_id' + ' AND member_permission.permission_id = :permissionId',
        { permissionId },
      )
      .getRawOne();

    return this.utilityService.convertObjectKeysToCamelCase(programByProgramRoleAndPermission);
  }

  async getProgramByProgramId(programId: string, manager: EntityManager) {
    const programByProgramId = await manager
      .getRepository(Program)
      .createQueryBuilder('program')
      .select([
        'program.id AS id',
        'program.title AS title',
        'program.cover_url AS cover_url',
        'program.cover_mobile_url AS cover_mobile_url',
        'program.cover_thumbnail_url AS cover_thumbnail_url',
        'program.abstract AS abstract',
      ])
      .where(`program.id = :programId`, { programId })
      .getRawOne();

    return this.utilityService.convertObjectKeysToCamelCase(programByProgramId);
  }

  async getProgramByProgramPackageEnrollment(memberId: string, programId: string, manager: EntityManager) {
    const programByProgramPackageEnrollment = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program.id AS id',
        'program.title AS title',
        'program.cover_url AS cover_url',
        'program.cover_mobile_url AS cover_mobile_url',
        'program.cover_thumbnail_url AS cover_thumbnail_url',
        'program.abstract AS abstract',
      ])
      .where(`order_log.member_id = :memberId`, { memberId })
      .andWhere('program.id = :programId', { programId })
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
      .innerJoin(
        'program_package_program',
        'program_package_program',
        'program_package_program.program_package_id = program_package.id' +
          ' AND program_package_program.program_id = :programId',
        { programId },
      )
      .leftJoin('program', 'program', 'program.id = program_package_program.program_id')
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
    return this.utilityService.convertObjectKeysToCamelCase(programByProgramPackageEnrollment);
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

  async getProgramContentInfo(programContentId: string, manager: EntityManager) {
    const programContentInfo = await manager
      .getRepository(ProgramContent)
      .createQueryBuilder('program_content')
      .select([
        'program_content.id AS id',
        'program_content.title AS title',
        'program_content.display_mode AS display_mode',
      ])
      .where('program_content.id = :programContentId', { programContentId })
      .getRawOne();

    return this.utilityService.convertObjectKeysToCamelCase(programContentInfo);
  }

  async getProgramContentById(programContentId: string, manager: EntityManager) {
    const programContent = await manager
      .getRepository(ProgramContent)
      .createQueryBuilder('program_content')
      .select([
        'program.app_id AS app_id',
        'program_content.id AS id',
        'program_content.title AS title',
        'program_content.abstract AS abstract',
        'program_content.content_body_id AS content_body_id',
        'program_content.published_at AS published_at',
        'program_content.duration AS duration',
        'program_content.display_mode AS display_mode',
        'program_content.content_type AS content_type',
        'program_content_section.title AS content_section_title',
        'program_content.metadata AS metadata',
        'program_content.list_price AS list_price',
        'program_content.sale_price AS sale_price',
        'program_content.sold_at AS sold_at',
        'program_content.pinned_status AS pinned_status',
      ])
      .where('program_content.id = :programContentId', { programContentId })
      .leftJoin(
        'program_content_section',
        'program_content_section',
        'program_content_section.id = program_content.content_section_id',
      )
      .innerJoin('program', 'program', 'program.id = program_content_section.program_id ')
      .getRawOne();

    const programContentAudio = await this.getProgramContentAudio(programContentId, manager);

    const programContentVideo = await this.getProgramContentVideo(programContentId, manager);

    const programContentAttachment = await this.getProgramContentAttachment(programContentId, manager);

    const programContentBody = await this.getProgramContentBody(programContentId, manager);

    return Object.keys(programContent).length > 0
      ? this.utilityService.convertObjectKeysToCamelCase({
          ...programContent,
          contentType: programContentBody.type,
          audios: programContentAudio,
          videos: programContentVideo,
          attachment: programContentAttachment,
          programContentBody,
        })
      : {};
  }

  async saveProgramContentLogs(programContentLogs: ProgramContentLog[], entityManager: EntityManager): Promise<void> {
    await entityManager.save(ProgramContentLog, programContentLogs);
  }

  async getEnrolledProgramContentById(
    memberId: string,
    programId: string,
    programContentId: string,
    manager: EntityManager,
    permissionId: string,
  ) {
    const programContentByProgramEnrollment = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program_content.id AS id',
        'program_content.title AS title',
        'program_content.abstract AS abstract',
        'program_content.content_body_id AS content_body_id',
        'program_content.published_at AS published_at',
        'program_content.duration AS duration',
        'program_content.display_mode AS display_mode',
        'program_content.content_type AS content_type',
        'program_content_section.title AS content_section_title',
        'program_content.metadata AS metadata',
        'program_content.list_price AS list_price',
        'program_content.sale_price AS sale_price',
        'program_content.sold_at AS sold_at',
        'program_content.pinned_status AS pinned_status',
      ])
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

    const programContentByProgramRole = await manager
      .getRepository(ProgramContent)
      .createQueryBuilder('program_content')
      .select([
        'program_content.id AS id',
        'program_content.title AS title',
        'program_content.abstract AS abstract',
        'program_content.content_body_id AS content_body_id',
        'program_content.published_at AS published_at',
        'program_content.duration AS duration',
        'program_content.display_mode AS display_mode',
        'program_content.content_type AS content_type',
        'program_content_section.title AS content_section_title',
        'program_content.metadata AS metadata',
        'program_content.list_price AS list_price',
        'program_content.sale_price AS sale_price',
        'program_content.sold_at AS sold_at',
        'program_content.pinned_status AS pinned_status',
      ])
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
          ` AND program_role.name = :role1 `,
        { memberId, role1: 'assistant' }, // 2024-02-27 Assistant is a half-developed feature and has not yet been used.
      )
      .getRawOne();

    const programContentByProgramRoleAndPermission = await manager
      .getRepository(ProgramContent)
      .createQueryBuilder('program_content')
      .select([
        'program_content.id AS id',
        'program_content.title AS title',
        'program_content.abstract AS abstract',
        'program_content.content_body_id AS content_body_id',
        'program_content.published_at AS published_at',
        'program_content.duration AS duration',
        'program_content.display_mode AS display_mode',
        'program_content.content_type AS content_type',
        'program_content_section.title AS content_section_title',
        'program_content.metadata AS metadata',
        'program_content.list_price AS list_price',
        'program_content.sale_price AS sale_price',
        'program_content.sold_at AS sold_at',
        'program_content.pinned_status AS pinned_status',
      ])
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
          ` AND (program_role.name = :role1 OR program_role.name = :role2) `,
        { memberId, role1: 'owner', role2: 'instructor' },
      )
      .innerJoin(
        'member_permission',
        'member_permission',
        'member_permission.member_id = program_role.member_id' + ' AND member_permission.permission_id = :permissionId',
        { permissionId },
      )
      .getRawOne();

    const programContentByProgramPlanEnrollmentSubscribedFromNowOrAll = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program_content.id AS id',
        'program_content.title AS title',
        'program_content.abstract AS abstract',
        'program_content.content_body_id AS content_body_id',
        'program_content.published_at AS published_at',
        'program_content.duration AS duration',
        'program_content.display_mode AS display_mode',
        'program_content.content_type AS content_type',
        'program_content_section.title AS content_section_title',
        'program_content.metadata AS metadata',
        'program_content.list_price AS list_price',
        'program_content.sale_price AS sale_price',
        'program_content.sold_at AS sold_at',
        'program_content.pinned_status AS pinned_status',
      ])
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
      .leftJoin(
        'program_content_section',
        'program_content_section',
        'program_content_section.program_id = program_plan.program_id',
      )
      .innerJoin(
        'program_content_plan',
        'program_content_plan',
        'program_content_plan.program_plan_id = program_plan.id' +
          ' AND program_content_plan.program_content_id = :programContentId',
        { programContentId },
      )
      .leftJoin('program_content', 'program_content', 'program_content.id = program_content_plan.program_content_id')
      .getRawOne();

    const programContentByProgramPlanEnrollment = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program_content.id AS id',
        'program_content.title AS title',
        'program_content.abstract AS abstract',
        'program_content.content_body_id AS content_body_id',
        'program_content.published_at AS published_at',
        'program_content.duration AS duration',
        'program_content.display_mode AS display_mode',
        'program_content.content_type AS content_type',
        'program_content_section.title AS content_section_title',
        'program_content.metadata AS metadata',
        'program_content.list_price AS list_price',
        'program_content.sale_price AS sale_price',
        'program_content.sold_at AS sold_at',
        'program_content.pinned_status AS pinned_status',
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

    const programContentByProgramPackageEnrollment = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program_content.id AS id',
        'program_content.title AS title',
        'program_content.abstract AS abstract',
        'program_content.content_body_id AS content_body_id',
        'program_content.published_at AS published_at',
        'program_content.duration AS duration',
        'program_content.display_mode AS display_mode',
        'program_content.content_type AS content_type',
        'program_content_section.title AS content_section_title',
        'program_content.metadata AS metadata',
        'program_content.list_price AS list_price',
        'program_content.sale_price AS sale_price',
        'program_content.sold_at AS sold_at',
        'program_content.pinned_status AS pinned_status',
      ])
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

    const programContentByMembershipEnrollment = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program_content.id AS id',
        'program_content.title AS title',
        'program_content.abstract AS abstract',
        'program_content.content_body_id AS content_body_id',
        'program_content.published_at AS published_at',
        'program_content.duration AS duration',
        'program_content.display_mode AS display_mode',
        'program_content.content_type AS content_type',
        'program_content_section.title AS content_section_title',
        'program_content.metadata AS metadata',
        'program_content.list_price AS list_price',
        'program_content.sale_price AS sale_price',
        'program_content.sold_at AS sold_at',
        'program_content.pinned_status AS pinned_status',
      ])
      .where(`order_log.member_id = :memberId`, { memberId })
      .andWhere(
        `((program_plan.type = 1 AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW()) AND (order_product.started_at IS NULL OR order_product.started_at <= NOW()))
        OR (program_plan.type = 2 AND program_content.published_at > order_product.delivered_at AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW()) AND (order_product.started_at IS NULL OR order_product.started_at <= NOW()))
        OR (program_plan.type = 3 AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW()) AND (order_product.started_at IS NULL OR order_product.started_at <= NOW())))`,
      )
      .andWhere('program_content.id = :programContentId', { programContentId })
      .innerJoin(
        'order_product',
        'order_product',
        'order_product.delivered_at < NOW()' + ' AND order_product.order_id = order_log.id',
      )
      .innerJoin('product', 'product', 'product.id = order_product.product_id' + ` AND product.type = :productType`, {
        productType: 'Card',
      })
      .innerJoin('program_plan', 'program_plan', 'program_plan.card_id::text = product.target')
      .leftJoin(
        'program_content_plan',
        'program_content_plan',
        'program_content_plan.program_plan_id = program_plan.id',
      )
      .innerJoin(
        'program_content_section',
        'program_content_section',
        'program_content_section.program_id = program_plan.program.id',
      )
      .innerJoin(
        'program_content',
        'program_content',
        '(program_plan.type = 3 AND program_content.content_section_id = program_content_section.id)' +
          ' OR (program_plan.type != 3 AND program_content.id = program_content_plan.program_content_id)' +
          ' AND program_content.published_at IS NOT NULL',
      )
      .getRawOne();

    const programContentAudio = await this.getProgramContentAudio(programContentId, manager);

    const programContentVideo = await this.getProgramContentVideo(programContentId, manager);

    const programContentAttachment = await this.getProgramContentAttachment(programContentId, manager);

    const programContentBody = await this.getProgramContentBody(programContentId, manager);

    const programContent = this.utilityService.convertObjectKeysToCamelCase({
      ...programContentByProgramEnrollment,
      ...programContentByProgramRole,
      ...programContentByProgramRoleAndPermission,
      ...programContentByProgramPlanEnrollmentSubscribedFromNowOrAll,
      ...programContentByProgramPlanEnrollment,
      ...programContentByProgramPackageEnrollment,
      ...programContentByMembershipEnrollment,
    });

    const isEquity = Object.keys(programContent).length > 0;

    return {
      ...programContent,
      contentType: programContentBody.type,
      audios: programContentAudio,
      videos: programContentVideo,
      attachment: programContentAttachment,
      programContentBody,
      isEquity,
    };
  }

  async getEnrolledProgramContentsByProgramId(
    memberId: string,
    programId: string,
    manager: EntityManager,
    permissionId: string,
  ) {
    const programContentsByProgramEnrollment = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select(['program_content.id AS program_content_id', 'program_content.display_mode AS display_mode'])
      .where(`order_log.member_id = :memberId`, { memberId })
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
          ' AND program_content.published_at IS NOT NULL',
      )
      .getRawMany();

    const programContentsByProgramRole = await manager
      .getRepository(ProgramContent)
      .createQueryBuilder('program_content')
      .select(['program_content.id AS program_content_id', 'program_content.display_mode AS display_mode'])
      .where('program.id = :programId', { programId })
      .leftJoin(
        'program_content_section',
        'program_content_section',
        'program_content_section.id = program_content.content_section_id',
      )
      .innerJoin('program', 'program', 'program.id = program_content_section.program_id')
      .innerJoin(
        'program_role',
        'program_role',
        'program_role.program_id = program.id' +
          ' AND program_role.member_id = :memberId' +
          ` AND program_role.name = :role1`,
        { memberId, role1: 'assistant' }, // 2024-02-27 Assistant is a half-developed feature and has not yet been used.
      )
      .getRawMany();

    const programContentsByProgramRoleAndPermission = await manager
      .getRepository(ProgramContent)
      .createQueryBuilder('program_content')
      .select(['program_content.id AS program_content_id', 'program_content.display_mode AS display_mode'])
      .where('program.id = :programId', { programId })
      .leftJoin(
        'program_content_section',
        'program_content_section',
        'program_content_section.id = program_content.content_section_id',
      )
      .innerJoin('program', 'program', 'program.id = program_content_section.program_id')
      .innerJoin(
        'program_role',
        'program_role',
        'program_role.program_id = program.id' +
          ' AND program_role.member_id = :memberId' +
          ` AND (program_role.name = :role1 OR program_role.name = :role2)`,
        { memberId, role1: 'owner', role2: 'instructor' },
      )
      .innerJoin(
        'member_permission',
        'member_permission',
        'member_permission.member_id = program_role.member_id' + ' AND member_permission.permission_id = :permissionId',
        { permissionId },
      )
      .getRawMany();

    const programContentsByProgramPlanEnrollmentSubscribedFromNowOrAll = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select(['program_content.id AS program_content_id', 'program_content.display_mode AS display_mode'])
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
      .innerJoin(
        'program_plan',
        'program_plan',
        'program_plan.id::text = product.target' + ' AND program_plan.program_id = :programId',
        { programId },
      )
      .leftJoin(
        'program_content_plan',
        'program_content_plan',
        'program_content_plan.program_plan_id = program_plan.id',
      )
      .innerJoin('program_content', 'program_content', 'program_content.id = program_content_plan.program_content_id')
      .getRawMany();

    const programContentsByProgramPlanEnrollment = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select(['program_content.id AS program_content_id', 'program_content.display_mode AS display_mode'])
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
      .innerJoin(
        'program_plan',
        'program_plan',
        'program_plan.id::text = product.target' +
          ' AND program_plan.type = 3' +
          ' AND program_plan.program_id = :programId',
        { programId },
      )
      .leftJoin(
        'program_content_section',
        'program_content_section',
        'program_content_section.program_id = program_plan.program_id',
      )
      .innerJoin(
        'program_content',
        'program_content',
        'program_content.content_section_id = program_content_section.id',
      )
      .getRawMany();

    const programContentsByProgramPackageEnrollment = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select(['program_content.id AS program_content_id', 'program_content.display_mode AS display_mode'])
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
      .innerJoin(
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
        'program_content.content_section_id = program_content_section.id',
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
      .getRawMany();

    const programContentsByMembershipCardEnrollment = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select(['program_content.id AS program_content_id', 'program_content.display_mode AS display_mode'])
      .where(`order_log.member_id = :memberId`, { memberId })
      .andWhere(
        `((program_plan.type = 1 AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW()) AND (order_product.started_at IS NULL OR order_product.started_at <= NOW()))
        OR (program_plan.type = 2 AND program_content.published_at > order_product.delivered_at AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW()) AND (order_product.started_at IS NULL OR order_product.started_at <= NOW()))
        OR (program_plan.type = 3 AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW()) AND (order_product.started_at IS NULL OR order_product.started_at <= NOW())))`,
      )
      .innerJoin(
        'order_product',
        'order_product',
        'order_product.delivered_at < NOW()' + ' AND order_product.order_id = order_log.id',
      )
      .innerJoin('product', 'product', 'product.id = order_product.product_id' + ` AND product.type = :productType`, {
        productType: 'Card',
      })
      .innerJoin('program_plan', 'program_plan', 'program_plan.card_id::text = product.target')
      .innerJoin('program', 'program', 'program.id = program_plan.program_id')
      .innerJoin(
        'program_content_section',
        'program_content_section',
        'program_content_section.program_id = program.id',
      )
      .leftJoin(
        'program_content_plan',
        'program_content_plan',
        'program_content_plan.program_plan_id = program_plan.id',
      )
      .innerJoin(
        'program_content',
        'program_content',
        '(program_plan.type = 3 AND program_content.content_section_id = program_content_section.id)' +
          ' OR (program_plan.type != 3 AND program_content.id = program_content_plan.program_content_id)' +
          ' AND program_content.published_at IS NOT NULL',
      )
      .getRawMany();

    return this.utilityService.convertObjectKeysToCamelCase(
      Array.from(
        new Map(
          [
            ...programContentsByProgramEnrollment,
            ...programContentsByProgramRole,
            ...programContentsByProgramRoleAndPermission,
            ...programContentsByProgramPlanEnrollmentSubscribedFromNowOrAll,
            ...programContentsByProgramPlanEnrollment,
            ...programContentsByProgramPackageEnrollment,
            ...programContentsByMembershipCardEnrollment,
          ].map((item) => [item.program_content_id, item]),
        ).values(),
      ),
    );
  }
  async getProgramContentsByProgramId(
    programId: string,
    entityManager: EntityManager,
  ): Promise<{ programContentId: string; displayMode: string }[]> {
    const programContentRepo = entityManager.getRepository(ProgramContent);
    const programContents = await programContentRepo.find({
      where: { contentSection: { programId } },
      select: ['id', 'displayMode'],
    });

    return programContents.map((content) => ({
      programContentId: content.id,
      displayMode: content.displayMode,
    }));
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

  async getProgramContentMaterialsByProgramId(
    programId: string,
    entityManager: EntityManager,
  ): Promise<{ programContentId: string; id: string; data: object; createdAt: Date }[]> {
    const programContentMaterials = await entityManager
      .getRepository(ProgramContentMaterial)
      .createQueryBuilder('program_content_material')
      .select([
        'program_content_material.program_content_id AS program_content_id',
        'program_content_material.id AS id',
        'program_content_material.data AS data',
        'program_content_material.created_at AS created_at',
      ])
      .innerJoin(
        'program_content',
        'program_content',
        'program_content.id = program_content_material.program_content_id',
      )
      .innerJoin(
        'program_content_section',
        'program_content_section',
        'program_content_section.id = program_content.content_section_id',
      )
      .where('program_content_section.program_id = :programId', { programId })
      .getRawMany();

    return this.utilityService.convertObjectKeysToCamelCase(programContentMaterials);
  }

  async getProgramContentAudio(programContentId: string, manager: EntityManager) {
    const programContentAudio = await manager
      .getRepository(ProgramContentAudio)
      .createQueryBuilder('program_content_audio')
      .select(['program_content_audio.data AS data'])
      .where('program_content_audio.program_content_id = :programContentId', { programContentId })
      .getRawOne();

    return this.utilityService.convertObjectKeysToCamelCase(programContentAudio ? [programContentAudio] : []);
  }
  async getProgramContentVideo(programContentId: string, manager: EntityManager) {
    const programContentVideo = await manager
      .getRepository(ProgramContentVideo)
      .createQueryBuilder('program_content_video')
      .select([
        'attachment.id AS id',
        'attachment.size AS size',
        'attachment.options AS options',
        'attachment.data AS data',
      ])
      .where('program_content_video.program_content_id = :programContentId', { programContentId })
      .innerJoin('attachment', 'attachment', 'attachment.id = program_content_video.attachment_id')
      .getRawOne();

    return this.utilityService.convertObjectKeysToCamelCase(programContentVideo ? [programContentVideo] : []);
  }

  async getProgramContentAttachment(programContentId: string, manager: EntityManager) {
    const programContentAttachment = await manager
      .getRepository(Attachment)
      .createQueryBuilder('attachment')
      .select([])
      .where('attachment.type = :type', { type: 'ProgramContent' })
      .andWhere('attachment.target = :programContentId', { programContentId })
      .getRawOne();
    return this.utilityService.convertObjectKeysToCamelCase(programContentAttachment ? [programContentAttachment] : []);
  }

  async getProgramContentBody(programContentId: string, manager: EntityManager) {
    const programContentBody = await manager
      .getRepository(ProgramContentBody)
      .createQueryBuilder('program_content_body')
      .select([
        'program_content_body.data AS data',
        'program_content_body.description AS description',
        'program_content_body.id AS id',
        'program_content_body.type AS type',
      ])
      .where('program_content.id = :programContentId', { programContentId })
      .innerJoin('program_content', 'program_content', 'program_content.content_body_id = program_content_body.id')
      .getRawOne();

    return this.utilityService.convertObjectKeysToCamelCase(programContentBody);
  }
}
