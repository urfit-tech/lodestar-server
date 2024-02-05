import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { OrderLog } from '~/order/entity/order_log.entity';
import { UtilityService } from '~/utility/utility.service';

@Injectable()
export class ProgramPackageInfrastructure {
  constructor(private readonly utilityService: UtilityService) {}
  async getOwnedProgramPackages(memberId: string, manager: EntityManager) {
    const programPackages = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program_package.id AS id',
        'program_package.title AS title',
        'program_package.cover_url AS cover_url',
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
        productType: 'ProgramPackagePlan',
      })
      .leftJoin('program_package_plan', 'program_package_plan', 'program_package_plan.id::text = product.target')
      .leftJoin('program_package', 'program_package', 'program_package.id = program_package_plan.program_package_id')
      .leftJoin(
        'program_package_program',
        'program_package_program',
        'program_package_program.program_package_id = program_package.id',
      )
      .leftJoin('program', 'program', 'program.id = program_package_program.program_id')
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
      .groupBy('program_package.id')
      .getRawMany();

    return this.utilityService.convertObjectKeysToCamelCase(programPackages);
  }

  async getExpiredProgramPackages(memberId: string, manager: EntityManager) {
    const programPackages = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program_package.id AS id',
        'program_package.title AS title',
        'program_package.cover_url AS cover_url',
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
        productType: 'ProgramPackagePlan',
      })
      .leftJoin('program_package_plan', 'program_package_plan', 'program_package_plan.id::text = product.target')
      .leftJoin('program_package', 'program_package', 'program_package.id = program_package_plan.program_package_id')
      .leftJoin(
        'program_package_program',
        'program_package_program',
        'program_package_program.program_package_id = program_package.id',
      )
      .leftJoin('program', 'program', 'program.id = program_package_program.program_id')
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
      .groupBy('program_package.id')
      .getRawMany();

    return this.utilityService.convertObjectKeysToCamelCase(programPackages);
  }

  async getEnrolledProgramPackageById(memberId: string, programPackageId: string, manager: EntityManager) {
    const programPackages = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'program_package.id AS id',
        'program_package.title AS title',
        'program_package.cover_url AS cover_url',
        'program_package_plan.is_tempo_delivery AS is_tempo_delivery',
        `JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('program_id', program.id,'program_title', program.title,'program_cover_url', program.cover_url,'program_content_id', program_content.id, 'progress', program_content_progress.progress ,'program_package_program_id', program_package_program.id,'position', program_package_program.position)) AS program_content_progress`,
        `JSONB_AGG(DISTINCT program_tempo_delivery.*) AS program_tempo_delivery`,
      ])
      .where(`order_log.member_id = :memberId`, { memberId })
      .andWhere('program_package.id = :programPackageId', { programPackageId })
      .andWhere('program.published_at IS NOT NULL')
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
        'program_package_program.program_package_id = program_package.id',
      )
      .leftJoin('program', 'program', 'program.id = program_package_program.program_id')
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
      .leftJoin(
        'program_tempo_delivery',
        'program_tempo_delivery',
        'program_tempo_delivery.program_package_program_id = program_package_program.id' +
          ' AND program_tempo_delivery.member_id = :memberId',
        {
          memberId,
        },
      )
      .groupBy('program_package.id')
      .addGroupBy('program_package_plan.id')
      .getRawOne();

    return this.utilityService.convertObjectKeysToCamelCase(programPackages);
  }
}
