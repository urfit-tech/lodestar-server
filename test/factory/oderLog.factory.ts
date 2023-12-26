import { EntityManager } from 'typeorm';
import { OrderLog } from '~/order/entity/order_log.entity';
import { Member } from '~/member/entity/member.entity';
import { faker } from '@faker-js/faker';

export const createTestOrderLog = async (
  entityManager: EntityManager,
  overrides: Partial<OrderLog> = {},
): Promise<OrderLog> => {
  const overrideRequireColumns = ['member', 'appId'];

  overrideRequireColumns.forEach((column) => {
    if (!overrides[column]) {
      throw new Error(`factory OrderLog: "${column}" property must be provided`);
    }
  });

  const orderLog = new OrderLog();
  orderLog.member = overrides.member;
  orderLog.appId = overrides.appId || overrides.member.appId;
  orderLog.invoiceOptions = overrides.invoiceOptions || {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: '0934567890',
    donationCode: '1000',
  };

  await entityManager.save(orderLog);
  return orderLog;
};
