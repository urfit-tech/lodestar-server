import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

import { APIException } from './api.excetion';

@Catch(APIException)
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: APIException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const { code, message, result } = exception;
    const status = exception.getStatus();

    response
      .status(status)
      .json({ code, message, result });
  }
}

