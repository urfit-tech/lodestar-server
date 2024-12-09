import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  InviteResourcesDTO,
  InsertEventsDTO,
  InsertEventResourceDTO,
  DeliverEventsDTO,
  UpdateEventDTO,
} from './event.dto';
import { batchInsert, batchUpdate } from './batchHelpers';

@Injectable()
export class EventService {
  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {}

  private subquery = {
    EVENT_RESOURCE: `
      SELECT 
          event.id AS event_id,
          event.started_at, event.ended_at,
          event.rrule, event.until,
          event.source_type, event.source_target,
          event.title, event.description,
          event.metadata AS event_metadata,
          event.deleted_at AS event_deleted_at,
          event_resource.temporally_exclusive_resource_id,
          event_resource.role,
          event_resource.is_exclusive,
          event_resource.is_attending,
          event_resource.metadata AS event_resource_metadata,
          event_resource.deleted_at AS event_resource_deleted_at
        FROM  event_temporally_exclusive_resource AS event_resource
        LEFT JOIN event ON event_resource.event_id = event.id
    `,
    EVENT_RESOURCE_FILTERED_BY_TIME_RANGE: (paramNumberOfStartedAt: number, paramNumberOfUntil: number) => `
      ${this.subquery.EVENT_RESOURCE}
      WHERE event.started_at >= $${paramNumberOfStartedAt} 
        AND COALESCE(event.until, event.ended_at) <= $${paramNumberOfUntil} 
    `,
  };

  getEventsByResourceIds(startedAt, until) {
    return async (resourceIds: Array<string>) =>
      await this.entityManager.query(
        `
        WITH
          event_resource AS (${this.subquery.EVENT_RESOURCE_FILTERED_BY_TIME_RANGE(1, 2)})
        SELECT * FROM event_resource
          WHERE event_resource.temporally_exclusive_resource_id = ANY($3)
      `,
        [startedAt, until, resourceIds],
      );
  }

  getEventsByResourceId(startedAt, until) {
    return async (resourceId: string) => await this.getEventsByResourceIds(startedAt, until)([resourceId]);
  }

  async getEventRelatedProducts(memberId) {
    return await this.entityManager.query(
      `
        WITH 
        member_order_product AS (
          SELECT 
            split_part(product_id, '_', 2) :: uuid AS appointment_plan_id,
            COALESCE(order_product.options ->> 'quantity', '0') :: int AS quantity
            FROM order_log LEFT JOIN order_product ON order_product.order_id = order_log.id
          WHERE member_id = $1 AND order_product.product_id LIKE 'AppointmentPlan%'
        )
        SELECT
            appointment_plan.id,
            appointment_plan.title, 
            appointment_plan.description,
            appointment_plan.duration,
            appointment_plan.capacity,
            member_order_product.quantity
          FROM appointment_plan
          LEFT JOIN member_order_product 
          ON appointment_plan.id = member_order_product.appointment_plan_id
        WHERE creator_id IS NULL AND quantity IS NOT NULL`,
      [memberId],
    );
  }

  private upsertTemprotallyExclusiveResource(type) {
    return (appId) => async (target) =>
      (
        await this.entityManager.query(
          `
      INSERT INTO temporally_exclusive_resource (type, target, app_id)
        VALUES ($1, $2, $3)
      ON CONFLICT (type, target) DO UPDATE SET target = EXCLUDED.target
      RETURNING id
    `,
          [type, target, appId],
        )
      )[0].id;
  }

  private registerMemberAsResource(appId) {
    return async (memberId) => await this.upsertTemprotallyExclusiveResource('member')(appId)(memberId);
  }

  insertEvents(appId: string) {
    return async (insertEventsDTO: InsertEventsDTO) => {
      const { events } = insertEventsDTO;
      const adaptedEvents = events.map((event) => ({ ...event, app_id: appId }));
      return await batchInsert(this.entityManager)('event')(adaptedEvents)(['id']);
    };
  }

  updateEvents(updateEventDTO: UpdateEventDTO) {
    return async (ids: Array<string>) => await batchUpdate(this.entityManager)('event')(ids)(updateEventDTO)(['id']);
  }

  updateEvent(updateEventDTO: UpdateEventDTO) {
    return async (id: string) => await this.updateEvents(updateEventDTO)([id]);
  }

  async insertEventResources(insertEventResourceDTO: InsertEventResourceDTO) {
    const { eventResources } = insertEventResourceDTO;
    return await batchInsert(this.entityManager)('event_temporally_exclusive_resource')(eventResources)(['id']);
  }

  async inviteResource(inviteResourcesDTO: InviteResourcesDTO) {
    const { eventIds, eventResources } = inviteResourcesDTO;
    return await this.insertEventResources({
      eventResources: eventIds.flatMap((eventId) =>
        eventResources.map((eventResource) => ({
          event_id: eventId,
          ...eventResource,
        })),
      ),
    });
  }

  async deliverEvents(deliverEventsDTO: DeliverEventsDTO) {
    const { source_type, source_target, member_id, amount, app_id } = deliverEventsDTO;
    const temporally_exclusive_resource_id = await this.registerMemberAsResource(app_id)(member_id);
    const events = Array(amount).fill({ source_type, source_target });
    const eventIds = (await this.insertEvents(app_id)({ events })).map((returning) => returning.id);
    const eventResources = eventIds.map((eventId) => ({
      event_id: eventId,
      temporally_exclusive_resource_id: temporally_exclusive_resource_id,
    }));
    const eventResourceIds = (await this.insertEventResources({ eventResources })).map((returning) => returning.id);
    return { eventIds: eventIds, eventResourceIds: eventResourceIds };
  }
}
