import { Injectable } from '@nestjs/common';
import { MailVerificationCode } from '../entity/MailVerificationCode';
import { EntityManager } from 'typeorm';

@Injectable()
export class MailVerificationCodeInfrastructure {
  async getAllMailVerificationCodesByEmail(appId: string, email: string, type: string, manager: EntityManager) {
    const verificationCodes = await manager
      .getRepository(MailVerificationCode)
      .createQueryBuilder('mailVerificationCode')
      .select('mailVerificationCode')
      .where('mailVerificationCode.appId = :appId', { appId })
      .andWhere('mailVerificationCode.email = :email', { email })
      .andWhere('mailVerificationCode.type = :type', { type })
      .getMany();
    return verificationCodes;
  }

  async insertVerificationCode(
    appId: string,
    email: string,
    type: string,
    code: string,
    expirationTimeMs: number,
    manager: EntityManager,
  ) {
    return await manager.getRepository(MailVerificationCode).insert({
      appId,
      email,
      type,
      code,
      expiredAt: new Date(new Date().getTime() + expirationTimeMs),
    });
  }

  async updateMailVerificationCodesToNow(
    ids: string[],
    appId: string,
    email: string,
    type: string,
    manager: EntityManager,
  ) {
    const mailVerificationCodeRepo = manager.getRepository(MailVerificationCode);
    const queryBuilder = mailVerificationCodeRepo
      .createQueryBuilder()
      .update()
      .set({ expiredAt: new Date() })
      .where('appId = :appId', { appId })
      .andWhere('email = :email', { email })
      .andWhere('type = :type', { type });
    if (ids.length > 0) {
      return await queryBuilder.andWhere('id IN (:...ids)', { ids }).execute();
    } else {
      return await queryBuilder.execute();
    }
  }

  async getUnexpiredMailVerificationCodesByEmail(appId: string, email: string, type: string, manager: EntityManager) {
    const verificationCodes = await manager
      .getRepository(MailVerificationCode)
      .createQueryBuilder('mailVerificationCode')
      .select('mailVerificationCode')
      .where('mailVerificationCode.appId = :appId', { appId })
      .andWhere('mailVerificationCode.email = :email', { email })
      .andWhere('mailVerificationCode.type = :type', { type })
      .andWhere('mailVerificationCode.expiredAt > NOW()')
      .getMany();
    return verificationCodes;
  }
}
