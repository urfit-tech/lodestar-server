import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PodcastAlbum } from '~/podcast/entity/PodcastAlbum';
import { PodcastProgramProgress } from '~/podcast/entity/PodcastProgramProgress';
import { OrderLog } from '~/order/entity/order_log.entity';
import { UtilityService } from '~/utility/utility.service';
import { PodcastProgressInfo } from './podcast.types';

@Injectable()
export class PodcastInfrastructure {
  constructor(private readonly utilityService: UtilityService) {}

  async getOwnedPodcasts(appId: string, memberId: string, manager: EntityManager) {
    const [ownedPodcastsSql, ownedPodcastsParameters] = this.getOwnedPodcastsDirectlyQuery(memberId, manager);
    const [ownedPodcastsFromPodcastPlanSql] = this.getOwnedPodcastsFromPodcastPlanQuery(memberId, manager);
    const [ownedPodcastsFromPublicPodcastAlbumSql] = this.getOwnedPodcastsFromPublicPodcastAlbumQuery(appId, manager);

    const podcasts = await manager.query(
      `
SELECT DISTINCT
	podcast_program.id AS id,
	podcast_program.title AS title,
  podcast_program.published_at AS published_at,
  podcast_program.cover_url AS cover_url,
  podcast_program.list_price AS list_price,
  podcast_program.sale_price AS sale_price,
  podcast_program.duration_second AS duration_second,
  JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', podcast_program_role.id,'member_id', member.id,'name', member.name,'username', member.username,'picture_url', member.picture_url)) AS roles
FROM
	(
		${ownedPodcastsSql}
		UNION
		${ownedPodcastsFromPodcastPlanSql}
		UNION
		${ownedPodcastsFromPublicPodcastAlbumSql}
	) p
	LEFT JOIN podcast_program ON podcast_program.id::text = p.podcast_program_id
	LEFT JOIN podcast_program_role ON podcast_program_role.podcast_program_id = podcast_program.id
	AND podcast_program_role.name = 'instructor'
  LEFT JOIN member ON member.id = podcast_program_role.member_id
GROUP BY
	podcast_program.id
`,
      [...ownedPodcastsParameters],
    );

    return this.utilityService.convertObjectKeysToCamelCase(podcasts);
  }

  async findPodcastProgramProgress(
    info: PodcastProgressInfo,
    entityManager: EntityManager,
  ): Promise<PodcastProgramProgress | null> {
    const podcastProgramProgressRepo = entityManager.getRepository(PodcastProgramProgress);
    return podcastProgramProgressRepo.findOne({
      where: {
        memberId: info.memberId,
        podcastProgramId: info.podcastProgramId,
      },
    });
  }

  async savePodcastProgramProgress(
    podcastProgramProgresss: PodcastProgramProgress[],
    entityManager: EntityManager,
  ): Promise<void> {
    await entityManager.save(PodcastProgramProgress, podcastProgramProgresss);
  }

  private getOwnedPodcastsDirectlyQuery(memberId: string, manager: EntityManager) {
    return manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select(['product.target::text AS podcast_program_id'])
      .where(`order_log.member_id = :memberId`, { memberId })
      .innerJoin(
        'order_product',
        'order_product',
        'order_product.order_id = order_log.id' +
          ' AND order_product.delivered_at < NOW()' +
          ' AND (order_product.ended_at IS NULL OR order_product.ended_at > NOW())' +
          ' AND (order_product.started_at IS NULL OR order_product.started_at <= NOW())',
      )
      .innerJoin('product', 'product', 'product.id = order_product.product_id' + ` AND product.type = 'PodcastProgram'`)
      .getQueryAndParameters();
  }

  private getOwnedPodcastsFromPodcastPlanQuery(memberId: string, manager: EntityManager) {
    return manager
      .getRepository(OrderLog)
      .createQueryBuilder('order_log')
      .select(['podcast_program_role.podcast_program_id::text AS podcast_program_id'])
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
      .leftJoin(
        'podcast_program_role',
        'podcast_program_role',
        'podcast_program_role.member_id = podcast_plan.creator_id' + ` AND podcast_program_role.name = 'instructor'`,
      )
      .getQueryAndParameters();
  }

  private getOwnedPodcastsFromPublicPodcastAlbumQuery(appId: string, manager: EntityManager) {
    return manager
      .getRepository(PodcastAlbum)
      .createQueryBuilder('podcast_album')
      .select(['podcast_album_podcast_program.podcast_program_id::text AS podcast_program_id'])
      .where(`podcast_album.app_id = '${appId}'`)
      .andWhere('podcast_album.is_public = true')
      .innerJoin(
        'podcast_album_podcast_program',
        'podcast_album_podcast_program',
        'podcast_album_podcast_program.podcast_album_id = podcast_album.id',
      )
      .getQueryAndParameters();
  }
}
