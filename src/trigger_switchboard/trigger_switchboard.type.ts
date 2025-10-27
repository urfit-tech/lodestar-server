type EventOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export type TriggeredEventDTO = {
  event: {
    op: EventOperation;
    data:
      | {
          old: Object;
          new: Object | null;
        }
      | {
          old: Object | null;
          new: Object;
        };
  };
  created_at: string;
  id: string;
  delivery_info: {
    max_retries: Number;
    current_retry: Number;
  };
  trigger: {
    name: string;
  };
  table: {
    schema: string;
    name: string;
  };
};

export type TriggeredEvent = Exclude<Pick<TriggeredEventDTO, 'event'>, 'trace_context'> &
  Pick<TriggeredEventDTO, 'trigger'> & { trigger: { type: string } };
export type IntegratedEvent = Pick<TriggeredEventDTO, 'event'> &
  Pick<TriggeredEventDTO, 'trigger'> &
  Pick<TriggeredEventDTO, 'created_at'>;
