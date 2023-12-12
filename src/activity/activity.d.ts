interface ActivityBasicCondition {
  organizerId?: string | null;
  isPrivate?: boolean;
  publishedAtNotNull?: boolean;
  activityEndedAfterNow?: boolean;
  appId: string;
}
