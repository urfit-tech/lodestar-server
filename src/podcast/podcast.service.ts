import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { APIException } from '~/api.excetion';
import { PodcastAlbum } from '~/entity/PodcastAlbum';
import { MemberService } from '~/member/member.service';
import { OrderLog } from '~/order/entity/order_log.entity';

@Injectable()
export class PodcastService {
  constructor(
    private readonly memberService: MemberService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  public async getPodcastByMemberId(appId: string, memberId: string) {
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

    const [podcastEnrollmentSql, podcastEnrollmentParameters] = this.entityManager
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

    const [podcastPlanEnrollmentSql] = this.entityManager
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

    const [publicPodcastSql] = this.entityManager
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

    const podcasts = await this.entityManager.query(
      `
SELECT
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
		${podcastEnrollmentSql}
		UNION
		${podcastPlanEnrollmentSql}
		UNION
		${publicPodcastSql}
	) p
	JOIN podcast_program ON podcast_program.id :: text = p.podcast_program_id
	JOIN podcast_program_role ON podcast_program_role.podcast_program_id = podcast_program.id
	AND podcast_program_role.name = 'instructor'
  JOIN member ON member.id = podcast_program_role.member_id
GROUP BY
	podcast_program.id
`,
      [...podcastEnrollmentParameters],
    );

    return podcasts;
  }
}
