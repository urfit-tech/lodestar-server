export type HasuraTrigger = {
  created_at: string;
  delivery_info: {
    current_retry: number;
    max_retries: number;
  };
  trigger: {
    name: string;
  };
  event: HasuraTriggerEvent | any;
  table: {
    name: string;
    schema: string;
  };
  key?: string;
}

export type HasuraTriggerEvent = {
  op: 'INSERT' | 'UPDATE' | 'DELETE'
  data: {
    old: null | { [key: string]: any }
    new: null | { [key: string]: any }
  }
  session_variables: {
    'x-hasura-app-id': string
    'x-hasura-org-id': string
    'x-hasura-role': string
    'x-hasura-user-id': string
  }
}
