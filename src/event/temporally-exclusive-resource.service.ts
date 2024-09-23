import { Injectable, } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  TemporallyExclusiveResourceType,
  CreateTemporallyExclusiveResourceDto,
} from './temporally-exclusive-resource.dto';

@Injectable()
export class TemporallyExclusiveResourceService {
  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {
    this.entityManager = entityManager
  }

  findByPermissionGroupIds(type: TemporallyExclusiveResourceType) {
    return async ({
      permissionGroupIds,
      memberProperties
    }: {
      permissionGroupIds: Array<string>,
      memberProperties?: Array<string>
    }) => {
      switch (type) {
        case 'member': {
          return await this.entityManager.query(`
          WITH
          resource_to_member AS (
            SELECT member.id AS member_id, member.email, member.name FROM temporally_exclusive_resource
              LEFT JOIN member ON temporally_exclusive_resource.target = member.id
            WHERE temporally_exclusive_resource.type = 'member'
          ),
          member_to_permission_group AS (
            SELECT * FROM member
              LEFT JOIN member_permission_group ON member.id = member_permission_group.member_id
              WHERE member_permission_group.permission_group_id = ANY($1 :: uuid[])
          ),
          member_to_property AS (
            SELECT member_id, jsonb_object_agg(property_id, value) AS target_properties FROM member_property
              WHERE property_id = ANY($2 :: uuid[])
            GROUP BY member_id
          )
          SELECT
            resource_to_member.member_id AS member_id,
            resource_to_member.email AS email,
            resource_to_member.name AS name,
            member_to_property.target_properties AS properties
            FROM resource_to_member 
                JOIN member_to_permission_group USING (member_id)
                JOIN member_to_property USING (member_id)
          `,
            [
              permissionGroupIds,
              memberProperties
            ])
        }
        case 'physical_space': {
          return await this.entityManager.query(`
            SELECT physical_space.id AS physical_space_id, 
              physical_space.capacity_amount, 
              physical_space.name, 
              physical_space.metadata ->> 'permission_group_id' AS permission_group_id
            FROM temporally_exclusive_resource
              LEFT JOIN physical_space ON temporally_exclusive_resource.target = physical_space.id :: text
            WHERE temporally_exclusive_resource.type = 'physical_space'
              AND physical_space.metadata ->> 'permission_group_id' = ANY($1)
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
        SELECT * FROM temporally_exclusive_resource
          WHERE type = $1 AND target = ANY($2) AND app_id = $3
      `,
        [type, targets, appId]
      )
  }

  create(appId: string) {
    return async (createTemporallyExclusiveResourceDto: CreateTemporallyExclusiveResourceDto) => {
      const { type, target } = createTemporallyExclusiveResourceDto
      return await this.entityManager.query(`
        INSERT INTO temporally_exclusive_resource (type, target, app_id)
          VALUES ($1, $2, $3)
        ON CONFLICT (type, target)
          DO UPDATE SET target = EXCLUDED.target
        RETURNING *
      `,
        [type, target, appId])
    }
  }
}
