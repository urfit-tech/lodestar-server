export interface CrossServerTokenDTO {
  clientId: string;
  key: string;
  permissions: Array<string>;
}

export interface GenerateTmpPasswordDto {
  appId: string;
  account: string;
  email: string;
  purpose: string;
}
