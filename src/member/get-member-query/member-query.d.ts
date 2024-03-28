interface QueryObserver {
  update(entityManager: EntityManager, queryBuilder: SelectQueryBuilder<Member>, conditions: FindOptionsWhere<Member>): Promise<void> | void;
}
