import { Injectable, } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  TemporallyExclusiveResourceType,
  CreateTemporallyExclusiveResourceDto,
} from './temporally-exclusive-resource.dto';
import { batchUpsert } from './batchHelpers';

@Injectable()
export class TemporallyExclusiveResourceService {
  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {
    this.entityManager = entityManager
  }

  findByPermissionGroupIds(type: TemporallyExclusiveResourceType) {
    return async ({
      permissionGroupIds,
      properties
    }: {
      permissionGroupIds: Array<string>,
      properties?: Array<string>
    }) => {
      console.log(23, type, permissionGroupIds, properties)
      switch (type) {
        case 'member': {
          return await this.entityManager.query(`
          WITH
          member_info AS (
            SELECT 
              temporally_exclusive_resource.id AS temporally_exclusive_resource_id,
              temporally_exclusive_resource.type,
              temporally_exclusive_resource.target,
              member.id AS member_id,
              member.email, 
              member.name 
            FROM temporally_exclusive_resource
              LEFT JOIN member ON temporally_exclusive_resource.target = member.id
            WHERE temporally_exclusive_resource.type = 'member'
          ),
          member_belonging_to_permission_group AS (
            SELECT member_id FROM member_permission_group
              WHERE ARRAY[permission_group_id] <@ $1 :: uuid[]
          ),
          permission_group_member_belongs_to AS (
            SELECT member_id, jsonb_agg(permission_group_id) AS permission_group_ids 
            FROM member_permission_group
            GROUP BY member_id
          ),
          member_to_property AS (
            SELECT member_id, jsonb_object_agg(property_id, value) AS target_properties 
            FROM member_property
            WHERE property_id = ANY($2 :: uuid[])
            GROUP BY member_id
          )
          SELECT
            member_info.*,
            permission_group_member_belongs_to.permission_group_ids,
            member_to_property.target_properties AS properties
            FROM member_belonging_to_permission_group
                JOIN permission_group_member_belongs_to USING (member_id)
                LEFT JOIN member_info USING (member_id)
                LEFT JOIN member_to_property USING (member_id)
          `,
            [
              permissionGroupIds,
              properties
            ])
        }
        case 'physical_space': {
          return await this.entityManager.query(`
            SELECT
              temporally_exclusive_resource.id AS temporally_exclusive_resource_id,
              temporally_exclusive_resource.type,
              temporally_exclusive_resource.target,
              physical_space.capacity_amount, 
              physical_space.name, 
              physical_space.metadata -> 'permission_group_id' AS permission_group_ids
            FROM temporally_exclusive_resource
              LEFT JOIN physical_space ON temporally_exclusive_resource.target = physical_space.id :: text
            WHERE temporally_exclusive_resource.type = 'physical_space'
              AND physical_space.metadata -> 'permission_group_id' @> array_to_json($1 :: text[]) :: jsonb
          `,
            [
              permissionGroupIds
            ])
        }
      }
    }
  }

  findByTarget(appId: string) {
    return (type: TemporallyExclusiveResourceType) =>
      async (targets: Array<string>) => await this.entityManager.query(`
        SELECT
          temporally_exclusive_resource.id AS temporally_exclusive_resource_id,
          temporally_exclusive_resource.type,
          temporally_exclusive_resource.target 
        FROM temporally_exclusive_resource
          WHERE type = $1 AND target = ANY($2) AND app_id = $3
      `,
        [type, targets, appId]
      )
  }

  create = async (payload: Array<{ type: string, target: string, app_id: string }>) =>
    await batchUpsert(this.entityManager)('temporally_exclusive_resource')(['type', 'target'])(['target'])(payload)(null)

}

