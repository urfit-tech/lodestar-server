export type TableOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export class PgTrigger {
  trigger_catalog: string;
  trigger_schema: string;
  trigger_name: string;
  event_manipulation: TableOperation;
};
