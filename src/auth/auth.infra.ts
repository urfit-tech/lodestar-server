import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { AuthAuditLog } from './entity/auth_audit_log.entity';

export type AppMemberRole = { id: string; role: string; hasPermission: boolean };
export type AppMemberEmail = { id: string; email: string; role: string };

@Injectable()
export class AuthInfrastructure {
  async insertAuthAuditLog(authAuditLog: AuthAuditLog, manager: EntityManager) {
    const authAuditLogRepo = manager.getRepository(AuthAuditLog);

    return authAuditLogRepo.insert(authAuditLog);
  }

  // current role of a member within the app, and whether member_permission currently grants the permission
  async getAppMemberWithPermission(
    memberId: string,
    appId: string,
    permissionId: string,
    manager: EntityManager,
  ): Promise<AppMemberRole | null> {
    const rows: Array<{ id: string; role: string; has_permission: boolean }> = await manager.query(
      `SELECT m.id, m.role,
              EXISTS (
                SELECT 1 FROM member_permission mp
                WHERE mp.member_id = m.id AND mp.permission_id = $3
              ) AS has_permission
         FROM member m
        WHERE m.id = $1 AND m.app_id = $2
        LIMIT 1`,
      [memberId, appId, permissionId],
    );
    const row = rows?.[0];
    return row ? { id: row.id, role: row.role, hasPermission: row.has_permission === true } : null;
  }

  async getAppMembersByExactEmail(appId: string, email: string, manager: EntityManager): Promise<AppMemberEmail[]> {
    return manager.query(`SELECT id, email, role FROM member WHERE app_id = $1 AND email = $2 LIMIT 2`, [appId, email]);
  }

  async getAppMembersByEmailIgnoringCase(
    appId: string,
    email: string,
    manager: EntityManager,
  ): Promise<AppMemberEmail[]> {
    return manager.query(`SELECT id, email, role FROM member WHERE app_id = $1 AND lower(email) = lower($2) LIMIT 2`, [
      appId,
      email,
    ]);
  }
}
