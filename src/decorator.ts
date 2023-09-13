import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ValidationOptions, ValidateIf } from 'class-validator';

export function IsNullable(validationOptions?: ValidationOptions) {
  return ValidateIf((_object, value) => value !== null, validationOptions);
}

export const Local = createParamDecorator((key: string, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getResponse().locals[key];
});
