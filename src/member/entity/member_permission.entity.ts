import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  expression: `
  CREATE OR REPLACE VIEW "public"."member_permission" AS 
  SELECT member.id AS member_id,
     role_permission.permission_id
    FROM (member
      JOIN role_permission ON ((role_permission.role_id = member.role)))
 UNION
  SELECT member.id AS member_id,
     app_default_permission.permission_id
    FROM (member
      JOIN app_default_permission ON ((app_default_permission.app_id = member.app_id)))
 UNION
  SELECT member_permission_extra.member_id,
     member_permission_extra.permission_id
    FROM member_permission_extra
 UNION
  SELECT member_permission_group.member_id,
     permission_group_permission.permission_id
    FROM ((member_permission_group
      JOIN permission_group ON ((permission_group.id = member_permission_group.permission_group_id)))
      JOIN permission_group_permission ON ((permission_group_permission.permission_group_id = permission_group.id)));
  `,
})
export class MemberPermission {
  @ViewColumn({ name: 'member_id' })
  memberId: string;

  @ViewColumn({ name: 'permission_id' })
  permissionId: string;
}
