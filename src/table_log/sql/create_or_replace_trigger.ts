const rawSql = (tableName: string, operation: 'INSERT' | 'UPDATE' | 'DELETE') => `
CREATE OR REPLACE TRIGGER lodestar_${tableName}_audit_${operation.toLowerCase()}
    AFTER ${operation} ON ${tableName} FOR EACH ROW EXECUTE PROCEDURE func_table_log('${tableName}');
`;

export default rawSql;
