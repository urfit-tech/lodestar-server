import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { rrulestr } from 'rrule';

export function IsValidRRule(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidRRule',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          try {
            const rrule = rrulestr(value);
            return rrule.all().length > 0;
          } catch (error) {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return 'The string must be a valid RRule that generates at least one datetime.';
        },
      },
    });
  };
}
