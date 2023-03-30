import { HttpException } from '@nestjs/common';

export class APIException extends HttpException {
  readonly code: string;
  readonly message: string;
  readonly result: any

  constructor(
    params:{ code: string; message: string; result?: any; },
    statusCode?: number,
  ) {
    super(params.code, statusCode || 400, params.result || null);
    this.code = params.code;
    this.message = params.message;
    this.result = params.result || null;
  }
}