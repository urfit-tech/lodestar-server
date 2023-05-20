import { Injectable } from '@nestjs/common';
import axios from 'axios';
import dayjs from 'dayjs';
import querystring from 'querystring';

import { UtilityService } from '~/utility/utility.service';

type EzpayClientResponse = {
  Status: string
  Message: string
  Result: {
    MerchantID: string
    InvoiceTransNo: string
    MerchantOrderNo: string
    TotalAmt: number
    InvoiceNumber: string
    RandomNum: string
    BarCode: string
  } | null
}

export type EzpayCredentials = {
  merchantId: string;
  hashKey: string;
  hashIV: string;
  options?: {
    dryRun: boolean;
  },
};

type EzpayIssueParams = Record<string, any>;

type EzpayRevokeParams = {
  invoiceNumber: string;
  invalidReason: string;
};

@Injectable()
export class EzpayClient {
  constructor(
    private readonly utilityService: UtilityService,
  ) {}

  static formCredentials(appSecrets: Record<string, string>): EzpayCredentials {
    if (!appSecrets['invoice.merchant_id']
      || !appSecrets['invoice.hash_key']
      || !appSecrets['invoice.hash_iv']
    ) {
      throw new Error('cannot create ezpay client: no ezpay secret env')
    }
  
    return {
      merchantId: appSecrets['invoice.merchant_id'],
      hashKey: appSecrets['invoice.hash_key'],
      hashIV: appSecrets['invoice.hash_iv'],
      options: {
        dryRun: ['1', 'true'].includes(appSecrets['invoice.dry_run']),
      },
    };
  }

  endpoint(dryRun: boolean): string {
    return dryRun
      ? 'https://cinv.ezpay.com.tw/Api'
      : 'https://inv.ezpay.com.tw/Api';
  }

  buildPostParams(hashKey: string, hashIV: string , payload: Record<string, any>) {
    const postData = querystring.stringify(payload)
    return this.utilityService.encrypt(hashKey, hashIV, postData);
  }

  async issue(credentials: EzpayCredentials, params: EzpayIssueParams): Promise<EzpayClientResponse> {
    const { merchantId, hashKey, hashIV, options } = credentials;
    const { payload } = params;
    const { data } = await axios.post(
      `${this.endpoint(options ? options.dryRun : true)}/invoice_issue`,
      querystring.stringify({
        MerchantID_: merchantId,
        PostData_: this.buildPostParams(hashKey, hashIV, {
          RespondType: 'JSON',
          Version: '1.4',
          TimeStamp: ~~(dayjs().toDate().getTime() / 1000),
          TransNum: '',
          TaxType: 1,
          Status: 1,
          CreateStatusTime: '',
          TaxRate: 5,
          TaxAmt: 0,
          ...payload,
        }),
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )
    let result = null
    try {
      result = JSON.parse(data.Result)
    } catch {}
    return {
      Status: data.Status,
      Message: data.Message,
      Result: result,
    }
  }

  async revoke(credentials: EzpayCredentials, params: EzpayRevokeParams) {
    const { merchantId, hashKey, hashIV, options } = credentials;
    const { invoiceNumber, invalidReason } = params;
    const { data } = await axios.post(
      `${this.endpoint(options ? options.dryRun : false)}/invoice_invalid`,
      querystring.stringify({
        MerchantID_: merchantId.toString(),
        PostData_: this.buildPostParams(hashKey, hashIV, {
          RespondType: 'JSON',
          Version: '1.0',
          TimeStamp: ~~(Date.now() / 1000),
          InvoiceNumber: invoiceNumber,
          InvalidReason: invalidReason,
        }),
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )
    return {
      ...data,
      Result: JSON.parse(data.Result),
    }
  }
}
