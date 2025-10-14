import { Injectable } from '@nestjs/common';
import { CardRepository } from './card.repository';

@Injectable()
export class CardService {
  constructor(private readonly cardRepository: CardRepository) {}
  public async findAllByApp(appId: string) {
    const allowedRelativePeriodTypes = ['Y', 'W', 'M', 'D'];
    const allowedExpiryTypes = ['fixed', 'relative'];
    const allowedDiscountTypes = ['cash', 'percentage'];

    return (await this.cardRepository.findAllByApp(appId)).map(card => ({
      id: card.id,
      title: card.title,
      description: card.description,
      template: card.template,
      sku: card.sku,
      fixedStartDate: card.fixedStartDate ? new Date(card.fixedStartDate).toISOString() : null,
      fixedEndDate: card.fixedEndDate ? new Date(card.fixedEndDate).toISOString() : null,
      relativePeriodType: allowedRelativePeriodTypes.includes(card.relativePeriodType) ? card.relativePeriodType : null,
      relativePeriodAmount: card.relativePeriodAmount,
      expiryType: allowedExpiryTypes.includes(card.expiryType) ? card.expiryType : 'fixed',
      creator:
        card.creator.id && card.creator.name
          ? {
              id: card.creator.id,
              name: card.creator.name,
            }
          : null,
      orders:
        card?.orders
          .filter(order => !!order.id)
          .map(order => ({
            id: order.id,
            status: order.status,
            memberId: order.memberId,
            memberEmail: order.memberEmail,
            memberName: order.memberName,
          })) || [],
      cardProducts:
        card?.cardProducts
          .filter(product => !!product.id)
          .map(product => ({
            id: product.id,
            productType: product.productType,
            target: product.target,
          })) || [],
      cardDiscounts:
        card?.cardDiscounts
          .filter(discount => !!discount.id)
          .map(discount => ({
            id: discount.id,
            productId: discount.productId,
            amount: discount.amount,
            type: allowedDiscountTypes.includes(discount.type) ? discount.type : 'cash',
          })) || [],
    }));
  }
}
