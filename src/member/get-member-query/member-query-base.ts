import { EntityManager, FindOptionsWhere, OrderByCondition, SelectQueryBuilder } from "typeorm";
import { Member } from "../entity/member.entity";
import { omit } from "lodash";

export default class MemberQueryObserveBase {
  private observers: QueryObserver[] = [];

  public addObserver(observer: QueryObserver): void {
    this.observers.push(observer);
  }

  public removeObserver(observer: QueryObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  public async execute(
    appId: string,
    conditions: FindOptionsWhere<Member>,
    order: OrderByCondition,
    entityManager: EntityManager,
  ): Promise<SelectQueryBuilder<Member>> {
    let queryBuilder = entityManager.getRepository(Member).createQueryBuilder('member');

    this.observers.forEach(observer => observer.update(entityManager, queryBuilder, conditions));

    const memberConditions = omit(conditions, ['memberPhones', 'memberTags', 'memberCategories', 'memberPermissionGroups', 'memberProperties']);

    queryBuilder = queryBuilder
      .where({ appId, ...memberConditions })
      .orderBy(Object.keys(order).reduce((prev, current) => ((prev[`member.${current}`] = order[current]), prev), {}));

    return queryBuilder;
  }
}
