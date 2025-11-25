type EventOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';

export type TriggeredEventDTO = {
  event: {
    op: EventOperation;
    data: any;
  };
  created_at: string;
  id: string;
  trigger: {
    name: string;
  };
};

export type TriggeredEvent = Exclude<Pick<TriggeredEventDTO, 'event'>, 'trace_context'> &
  Pick<TriggeredEventDTO, 'trigger'> & { trigger: { type: string } };

export type IntegratedEvent = Pick<TriggeredEventDTO, 'event'> &
  Pick<TriggeredEventDTO, 'trigger'> &
  Pick<TriggeredEventDTO, 'created_at'>;

export type TriggerWebhookUrl = {
  trigger_name: string;
  request_infos: Array<{ url: string; fetchOption: RequestInit }>;
};
