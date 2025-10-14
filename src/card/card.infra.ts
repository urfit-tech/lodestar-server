import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CardJoinDTO } from './dto/card-join.dto';
import { CardRepository } from './card.repository';
import { Card } from './entity/Card';

@Injectable()
export class CardInfrastructure extends CardRepository {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async findAllByApp(appId: string): Promise<CardJoinDTO[]> {
    const cards = await this.dataSource.manager
      .getRepository(Card)
      .createQueryBuilder('card')
      .select([
        'card.id AS card_id',
        'card.title AS card_title',
        'card.description AS card_description',
        'card.template AS card_template',
        'card.sku AS card_sku',
        'card.fixed_start_date AS fixed_start_date',
        'card.fixed_end_date AS fixed_end_date',
        'card.relative_period_type AS relative_period_type',
        'card.relative_period_amount AS relative_period_amount',
        'card.expiry_type AS expiry_type',
        'member_creator.id AS creator_id',
        'member_creator.name AS creator_name',
        'json_agg(DISTINCT jsonb_build_object(' +
          `'id', card_product.id, 'product_type', card_product.product_type, 'target', card_product.target` +
          ')) AS products',
        'json_agg(DISTINCT jsonb_build_object(' +
          `'id', card_discount.id, 'product_id', card_discount.product_id, 'amount', card_discount.amount, 'type', card_discount.type` +
          ')) AS discounts',
        'json_agg(DISTINCT jsonb_build_object(' +
          `'order_id', order_log.id,'status',order_log.status, 'member_id', member.id, 'member_email', member.email, 'member_name', member.name` +
          ')) AS orders',
      ])
      .leftJoin('card_product', 'card_product', 'card_product.card_id = card.id and card_product.is_deleted = false')
      .leftJoin('card_discount', 'card_discount', 'card_discount.card_id = card.id')
      .leftJoin(
        'order_product',
        'order_product',
        'order_product.product_id = (card_product.product_type||card_product.target)',
      )
      .leftJoin('order_log', 'order_log', 'order_log.id = order_product.order_id')
      .leftJoin('member', 'member', 'member.id = order_log.member_id')
      .leftJoin('member', 'member_creator', 'member_creator.id = card.creator_id')
      .where('card.app_id = :appId', { appId })
      .groupBy('card.id, member_creator.id')
      .getRawMany();

    return cards.map(row => ({
      id: row.card_id,
      title: row.card_title,
      description: row.card_description,
      template: row.card_template,
      sku: row.card_sku,
      fixedStartDate: row.fixed_start_date,
      fixedEndDate: row.fixed_end_date,
      relativePeriodType: row.relative_period_type,
      relativePeriodAmount: row.relative_period_amount,
      expiryType: row.expiry_type,
      creator: {
        id: row.creator_id,
        name: row.creator_name,
      },
      orders: row.orders
        .filter(order => !!order.id)
        .map(order => ({
          id: order.order_id,
          status: order.status,
          memberId: order.member_id,
          memberEmail: order.member_email,
          memberName: order.member_name,
        })),
      cardProducts: row.products
        .filter(product => !!product.id)
        .map(product => ({
          id: product.id,
          productType: product.product_type,
          target: product.target,
        })),
      cardDiscounts: row.discounts
        .filter(discount => !!discount.id)
        .map(discount => ({
          id: discount.id,
          productId: discount.product_id,
          amount: discount.amount,
          type: discount.type,
        })),
    }));
  }
}
