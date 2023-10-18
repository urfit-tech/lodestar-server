import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { OrderLog } from '~/order/entity/order_log.entity';
import { UtilityService } from '~/utility/utility.service';

@Injectable()
export class PodcastPlanInfrastructure {
  constructor(private readonly utilityService: UtilityService) {}

  async getOwnedPodcastPlan(memberId: string, manager: EntityManager) {
    const podcastPlans = await manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select([
        'podcast_plan.id AS id',
        `JSONB_BUILD_OBJECT('id', member.id,'name', member.name,'username', member.username,'picture_url', member.picture_url) AS creator`,
      ])
      .where(`order_log.member_id = :memberId`, { memberId })
      .innerJoin(
        'order_product',
        'order_product',
        'order_product.order_id = order_log.id' +
          ' AND order_product.delivered_at < NOW()' +
          ' AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW())' +
          ' AND (order_product.started_at IS NULL OR order_product.started_at <= NOW())',
      )
      .innerJoin('product', 'product', 'product.id = order_product.product_id' + ` AND product.type = 'PodcastPlan'`)
      .leftJoin('podcast_plan', 'podcast_plan', 'podcast_plan.id::text = product.target')
      .leftJoin('member', 'member', 'member.id = podcast_plan.creator_id')
      .groupBy('podcast_plan.id')
      .addGroupBy('member.id')
      .getRawMany();

    return this.utilityService.convertObjectKeysToCamelCase(podcastPlans);
  }
}
