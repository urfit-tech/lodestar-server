export enum MemberRole {
  GENERAL_MEMBER = 'general-member',
  CONTENT_CREATOR = 'content-creator',
  APP_OWNER = 'app-owner',
  ORG_MANAGER = 'org-manager',
};

export interface PublicMember {
  id: string;
  orgId: string;
  appId: string;
  email: string;
  username: string;
  name: string;
  pictureUrl: string;
  isBusiness: boolean;
};
