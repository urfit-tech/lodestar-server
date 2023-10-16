import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

import { OrderLog } from '~/order/entity/order_log.entity';
import { MemberService } from '~/member/member.service';
import { APIException } from '~/api.excetion';

@Injectable()
export class ProgramPackageService {
  constructor(
    private readonly memberService: MemberService,
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

    const ownedProgramPackages = await this.entityManager
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

    const programPackages = [...new Set(ownedProgramPackages)];
    return programPackages;
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

    const expiredProgramPackages = await this.entityManager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select(['program_package.id AS id', 'program_package.title AS title', 'program_package.cover_url AS cover_url'])
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
      .groupBy('program_package.id')
      .getRawMany();

    const programPackages = [...new Set(expiredProgramPackages)];

    return programPackages;
  }
}
