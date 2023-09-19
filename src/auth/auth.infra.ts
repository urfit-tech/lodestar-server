import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { AuthAuditLog } from './entity/auth_audit_log.entity';

@Injectable()
export class AuthInfrastructure {
  async insertAuthAuditLog(authAuditLog: AuthAuditLog, manager: EntityManager) {
    const authAuditLogRepo = manager.getRepository(AuthAuditLog);

    return authAuditLogRepo.insert(authAuditLog);
  }
}
