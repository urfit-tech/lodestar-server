import { EntityManager } from 'typeorm';
import { Member } from '~/member/entity/member.entity';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';

export const createTestMember = async (
  entityManager: EntityManager,
  overrides: Partial<Member> = {},
): Promise<Member> => {
  const overrideRequireColumns = ['appId'];

  overrideRequireColumns.forEach((column) => {
    if (!overrides[column]) {
      throw new Error(`factory ActivityTicket: "${column}" property must be provided`);
    }
  });

  const member = new Member();

  member.appId = overrides.appId;
  member.id = overrides.id || uuidv4();
  member.name = overrides.name || faker.person.fullName();
  member.username = overrides.username || faker.internet.userName();
  member.email = overrides.email || faker.internet.email();
  member.role = overrides.role || 'general-member';
  member.star = overrides.star !== undefined ? overrides.star : faker.number.int({ min: 0, max: 5 });
  member.createdAt = overrides.createdAt || new Date();
  member.loginedAt = overrides.loginedAt || new Date();

  await entityManager.save(member);
  return member;
};
