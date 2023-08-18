export interface MetabasePayload {
  resource: { question: number } | { dashboard: number };
  params: any;
  exp: number;
}

export interface GetReportDTO {
  id: string;
  title: string;
  type: 'metabase' | 'unknown';
  appId: string;
  options: ReportOptions;
}

export interface ReportOptions {
  metabase: MetabasePayload | null;
}
