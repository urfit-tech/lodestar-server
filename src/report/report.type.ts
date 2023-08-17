export interface MetabasePayload {
  resource: { question: number } | { dashboard: number };
  params: any;
  exp: number;
}

export interface Report {
  id: string;
  title: string;
  type: 'metabase';
  appId: string;
  options: ReportOptions;
}

export interface ReportOptions {
  metabase: MetabasePayload | null;
}
