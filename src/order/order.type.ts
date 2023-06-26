export interface TransferReceivedOrderToken {
  appId: string;
  email: string;
  orderLogId: string;
  orderProductId: string;
  title: string;
  ownerName: string;
  iat: number;
  exp: number;
}

export interface TransferReceivedOrderDTO {
  memberId: string;
  orderId: string;
}

export interface TransferReceivedOrderBodyDTO {
  token: string;
  memberId: string;
}
