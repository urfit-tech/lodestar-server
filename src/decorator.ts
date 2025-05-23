import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ValidationOptions, ValidateIf } from 'class-validator';

export function IsNullable(validationOptions?: ValidationOptions) {
  return ValidateIf((_object, value) => value !== null, validationOptions);
}

export function IsUndefinable(validationOptions?: ValidationOptions) {
  return ValidateIf((_object, value) => value !== undefined, validationOptions);
}

export const Local = createParamDecorator((key: string, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getResponse().locals[key];
});

// FIXME: 後端判斷權限組
export const GetPermissions = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.locals?.member?.permissions || [];
});
