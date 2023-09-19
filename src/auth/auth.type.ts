export interface CrossServerTokenDTO {
  clientId: string;
  key: string;
  permissions: Array<string>;
}

export interface GenerateTmpPasswordDTO {
  appId: string;
  applicant: string;
  email: string;
  purpose: string;
}
