import { TableOperation } from '../table_log.type';

const rawSql = (tableName: string, operation: TableOperation) => `
  SELECT
    *
  FROM information_schema.triggers
  WHERE event_object_table = '${tableName}'
	  AND event_manipulation = '${operation}';
`;

export default rawSql;
