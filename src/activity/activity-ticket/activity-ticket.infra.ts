import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Category } from '~/definition/entity/category.entity';
import { OrderProduct } from '~/order/entity/order_product.entity';
import { OrderLog } from '~/order/entity/order_log.entity';
import { MemberRightActivityTicketDataDto } from '~/equity/dto/equity-activity-ticket.dto';
import { ActivityTicketEnrollment } from '../view_entity/ActivityTicketEnrollment';
import { ActivityCategory } from '../entity/ActivityCategory';
import { ActivitySession } from '../entity/ActivitySession';

@Injectable()
export class ActivityTicketInfrastructure {
  async getActivityTicketInfoByIdAndMemberId(
    manager: EntityManager,
    activityTicketId: string,
    memberId: string,
    sessionId: string | null,
  ): Promise<MemberRightActivityTicketDataDto> {
    const activityTicket = await this._fetchActivityTicket(manager, activityTicketId, memberId);
    const invoice = await this._fetchInvoice(manager, activityTicketId, memberId);
    const categories = await this._fetchCategories(manager, activityTicket.activityId);
    const sessions = await this._fetchSessions(manager, activityTicketId, sessionId);

    return {
      id: activityTicket.id,
      activity: {
        id: activityTicket.activityId,
        title: activityTicket.activityTitle,
        coverUrl: activityTicket.activityCoverUrl,
        categories,
        isParticipantsVisible: activityTicket.isParticipantsVisible,
      },
      sessions: this._mapSessions(sessions),
      invoice: {
        name: invoice.invoiceOptions.name,
        email: invoice.invoiceOptions.email,
        phone: invoice.invoiceOptions.phone,
        orderProductId: invoice.orderProductId,
      },
    };
  }

  private async _fetchActivityTicket(manager: EntityManager, activityTicketId: string, memberId: string) {
    return await manager
      .createQueryBuilder(ActivityTicketEnrollment, 'ate')
      .select('at2.id', 'id')
      .addSelect('a.id', 'activityId')
      .addSelect('a.title', 'activityTitle')
      .addSelect('a.cover_url', 'activityCoverUrl')
      .addSelect('m.name', 'name')
      .addSelect('m.id', 'memberId')
      .addSelect('a.is_participants_visible', 'isParticipantsVisible')
      .innerJoin('activity_ticket', 'at2', 'at2.id = ate.activity_ticket_id')
      .innerJoin('activity', 'a', 'a.id = at2.activity_id')
      .innerJoin('member', 'm', 'm.id = ate.member_id')
      .where('m.id = :memberId', { memberId })
      .andWhere('at2.id = :activityTicketId', { activityTicketId })
      .getRawOne();
  }

  private async _fetchInvoice(manager: EntityManager, activityTicketId: string, memberId: string) {
    return await manager
      .createQueryBuilder(ActivityTicketEnrollment, 'ate')
      .select('ol.invoice_options', 'invoiceOptions')
      .addSelect('ate.order_product_id', 'orderProductId')
      .innerJoin(OrderProduct, 'op', 'op.id = ate.order_product_id')
      .innerJoin(OrderLog, 'ol', 'ol.id = op.order_id')
      .andWhere('ate.member_id = :memberId', { memberId })
      .andWhere('ate.activity_ticket_id = :activityTicketId', { activityTicketId })
      .getRawOne();
  }

  private async _fetchCategories(manager: EntityManager, activityId: string) {
    return await manager
      .createQueryBuilder(Category, 'c')
      .select('c.id', 'id')
      .addSelect('c.name', 'name')
      .innerJoin(ActivityCategory, 'ac', 'ac.category_id = c.id')
      .andWhere('ac.activity_id = :activityId', { activityId })
      .getRawMany();
  }

  private async _fetchSessions(manager: EntityManager, activityTicketId: string, sessionId: string | null) {
    const queryBuilder = manager
      .createQueryBuilder(ActivitySession, 'asession')
      .select(
        `DISTINCT ON (asession.id) asession.id as id,
        asession.started_at as "startedAt",
        asession.ended_at as "endedAt",
        asession.location as "location",
        asession.description as "description",
        asession.threshold as "threshold",
        asession.online_link as "onlineLink",
        asession.title as "title",
        astec.activity_offline_session_ticket_count as "offlineParticipants",
        astec.activity_online_session_ticket_count as "onlineParticipants",
        ast.activity_session_type as "type",
        (SELECT SUM(CASE WHEN ast.activity_session_type = 'offline' THEN 1 ELSE 0 END) FROM activity_session_ticket ast WHERE ast.activity_session_id = asession.id) as "maxAmountOffline",
        (SELECT SUM(CASE WHEN ast.activity_session_type = 'online' THEN 1 ELSE 0 END) FROM activity_session_ticket ast WHERE ast.activity_session_id = asession.id) as "maxAmountOnline",
        ae.attended as "attended"`,
      )
      .leftJoin('activity_session_ticket', 'ast', 'ast.activity_session_id = asession.id')
      .leftJoin('activity_ticket', 'at', 'at.id = ast.activity_ticket_id')
      .leftJoin('activity_session_ticket_enrollment_count', 'astec', 'astec.activity_session_id = asession.id')
      .leftJoin('activity_enrollment', 'ae', 'ae.activity_session_id = asession.id AND ae.activity_ticket_id = at.id')
      .where('at.id = :activityTicketId', { activityTicketId })
      .orderBy('asession.id', 'DESC');

    if (sessionId && sessionId !== '') {
      queryBuilder.andWhere('asession.id = :sessionId', { sessionId });
    }
    return await queryBuilder.getRawMany();
  }

  private _mapSessions(sessions) {
    return sessions.map((session) => ({
      id: session.id,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      location: session.location,
      description: session.description,
      threshold: session.threshold,
      onlineLink: session.onlineLink,
      title: session.title,
      maxAmount: {
        offline: parseInt(session.maxAmountOffline, 10) || 0,
        online: parseInt(session.maxAmountOnline, 10) || 0,
      },
      participants: {
        online: Number(session.onlineParticipants),
        offline: Number(session.offlineParticipants),
      },
      isEnrolled: true,
      type: session.type,
      attended: session.attended,
    }));
  }
}
