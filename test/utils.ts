import { DataSource, EntityManager, QueryRunner } from 'typeorm';

export async function autoRollbackTransaction<T>(
  manager: EntityManager,
  run: (manager: EntityManager) => Promise<T>
) {
  const ds: DataSource = manager.connection;
  const qr: QueryRunner = ds.createQueryRunner();

  try {
    await qr.connect();
    await qr.startTransaction('SERIALIZABLE');

    await run(qr.manager);
  } finally {
    await qr.rollbackTransaction();
    await qr.release();
  }
}
