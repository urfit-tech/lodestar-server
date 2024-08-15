import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  InviteResourcesDTO,
  InsertEventsDTO,
  InsertEventResourceDTO,
  DeliverEventsDTO,
  UpdateEventDTO
} from './event.dto'

@Injectable()
export class EventService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) { }

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
    `
  }

  getEventsByResourceIds(startedAt, until) {
    return async (resourceIds: Array<string>) => await this.entityManager.query(`
        WITH
          event_resource AS (${this.subquery.EVENT_RESOURCE_FILTERED_BY_TIME_RANGE(1, 2)})
        SELECT * FROM event_resource
          WHERE event_resource.temporally_exclusive_resource_id = ANY($3)
      `,
      [startedAt, until, resourceIds])
  }

  getEventsByResourceId(startedAt, until) {
    return async (resourceId: string) => await this.getEventsByResourceIds(startedAt, until)([resourceId])
  }

  async getEventRelatedProducts(memberId) {
    return await this.entityManager.query(`
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
      [memberId])
  }

  private upsertTemprotallyExclusiveResource(type) {
    return (appId) => async (target) => (await this.entityManager.query(`
      INSERT INTO temporally_exclusive_resource (type, target, app_id)
        VALUES ($1, $2, $3)
      ON CONFLICT (type, target) DO UPDATE SET target = EXCLUDED.target
      RETURNING id
    `,
      [type, target, appId]))[0].id
  }

  private registerMemberAsResource(appId) {
    return async (memberId) => (await this.upsertTemprotallyExclusiveResource('member')(appId)(memberId))
  }

  private generateInsertString(payload) {
    const unique = arr => arr.filter((v, i, a) => a.indexOf(v) === i)
    const keys = unique(payload.flatMap(Object.keys))
    const keysString = `(${keys.join(', ')})`
    const keysToValueString = keys => obj => `(${keys.map(key => obj?.[key] ?? 'null')
      .map(val => typeof val === 'object' ? JSON.stringify(val) : val)
      .map(val => typeof val === 'number' ? val : `'${val}'`).join(', ')})`
    const valueString = payload.map(obj => keysToValueString(keys)(obj)).join(', ')
    return { keysString, valueString }
  }

  private batchInsert(tableName: string) {
    return (payload) => async (returningColumns: Array<string>) => {
      const returningString = returningColumns?.join?.(', ') ?? '*'
      const { keysString, valueString } = this.generateInsertString(payload)
      return await this.entityManager.query(`
      INSERT INTO ${tableName} ${keysString === '()' ?
          'DEFAULT VALUES' :
          `${keysString} VALUES ${valueString}`}
      RETURNING ${returningString}
    `)
    }
  }

  private generateUpdateString(payload) {
    return Object.entries(payload).map(([key, value]) => {
      switch (typeof value) {
        case 'object': return `${key}=${JSON.stringify(value)}`
        case 'number': return `${key}=${value}`
        default: return `${key}='${value}'`
      }
    }).join(', ')
  }

  private batchUpdate(tableName: string) {
    return (ids: Array<string>) => (payload) => async (returningColumns: Array<string>) => {
      const returningString = returningColumns?.join?.('') ?? '*'
      const setString = this.generateUpdateString(payload)
      console.log(`
      UPDATE ${tableName} SET ${setString}
      WHERE id = ANY($1)
      RETURNING ${returningString}
    `)
      return await this.entityManager.query(`
      UPDATE ${tableName} SET ${setString}
      WHERE id = ANY($1)
      RETURNING ${returningString}
    `, [ids])
    }
  }

  async insertEvents(insertEventsDTO: InsertEventsDTO) {
    const { events } = insertEventsDTO
    return await this.batchInsert('event')(events)(['id'])
  }

  updateEvents(updateEventDTO: UpdateEventDTO) {
    return async (ids: Array<string>) => await this.batchUpdate('event')(ids)(updateEventDTO)(['id'])
  }

  updateEvent(updateEventDTO: UpdateEventDTO) {
    return async (id: string) => await this.updateEvents(updateEventDTO)([id])
  }

  async insertEventResources(insertEventResourceDTO: InsertEventResourceDTO) {
    const { eventResources } = insertEventResourceDTO
    console.log(152, eventResources)
    return await this.batchInsert('event_temporally_exclusive_resource')(eventResources)(['id'])
  }

  async inviteResource(inviteResourcesDTO: InviteResourcesDTO) {
    const { eventIds, eventResources } = inviteResourcesDTO
    return await this.insertEventResources({
      eventResources: eventIds.flatMap(
        eventId => eventResources.map(
          eventResource => ({
            event_id: eventId,
            ...eventResource
          })
        )
      )
    })
  }

  async deliverEvents(deliverEventsDTO: DeliverEventsDTO) {
    const { source_type, source_target, member_id, amount, app_id } = deliverEventsDTO
    const temporally_exclusive_resource_id = await this.registerMemberAsResource(app_id)(member_id)
    const events = Array(amount).fill({ source_type, source_target })
    const eventIds = (await this.insertEvents({ events })).map(returning => returning.id)
    const eventResources = eventIds.map(eventId => ({ event_id: eventId, temporally_exclusive_resource_id: temporally_exclusive_resource_id }))
    const eventResourceIds = (await this.insertEventResources({ eventResources })).map(returning => returning.id)
    return { eventIds: eventIds, eventResourceIds: eventResourceIds }
  }
}
