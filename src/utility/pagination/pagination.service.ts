import { Injectable } from '@nestjs/common';
import { ObjectLiteral } from 'typeorm';
import Paginator from './class/paginator';
import { Order, PaginationOptions } from './pagination.type';

@Injectable()
export class PaginationService {
  buildPaginator<Entity extends ObjectLiteral>(options: PaginationOptions<Entity>): Paginator<Entity> {
    const { entity, query = {}, alias = entity.name.toLowerCase(), paginationKeys = ['id' as any] } = options;

    const paginator = new Paginator(entity, paginationKeys);

    paginator.setAlias(alias);

    if (query.afterCursor) {
      paginator.setAfterCursor(query.afterCursor);
    }

    if (query.beforeCursor) {
      paginator.setBeforeCursor(query.beforeCursor);
    }

    if (query.limit) {
      paginator.setLimit(query.limit);
    }

    if (query.order) {
      paginator.setOrder(query.order as Order);
    }

    return paginator;
  }
  atob(value: string): string {
    return Buffer.from(value, 'base64').toString();
  }

  btoa(value: string): string {
    return Buffer.from(value).toString('base64');
  }

  encodeByType(type: string, value: any): string | null {
    if (value === null) return null;

    switch (type) {
      case 'date': {
        return (value as Date).getTime().toString();
      }
      case 'number': {
        return `${value}`;
      }
      case 'string': {
        return encodeURIComponent(value);
      }
      case 'object': {
        /**
         * if reflection type is Object, check whether an object is a date.
         * see: https://github.com/rbuckton/reflect-metadata/issues/84
         */
        if (typeof value.getTime === 'function') {
          return (value as Date).getTime().toString();
        }

        break;
      }
      default:
        break;
    }

    throw new Error(`unknown type in cursor: [${type}]${value}`);
  }

  decodeByType(type: string, value: string): string | number | Date {
    switch (type) {
      case 'object':
      case 'date': {
        const timestamp = parseInt(value, 10);

        if (Number.isNaN(timestamp)) {
          throw new Error('date column in cursor should be a valid timestamp');
        }

        return new Date(timestamp);
      }

      case 'number': {
        const num = parseFloat(value);

        if (Number.isNaN(num)) {
          throw new Error('number column in cursor should be a valid number');
        }

        return num;
      }

      case 'string': {
        return decodeURIComponent(value);
      }

      default: {
        throw new Error(`unknown type in cursor: [${type}]${value}`);
      }
    }
  }

  private camelOrPascalToUnderscore(str: string): string {
    return str
      .split(/(?=[A-Z])/)
      .join('_')
      .toLowerCase();
  }

  pascalToUnderscore(str: string): string {
    return this.camelOrPascalToUnderscore(str);
  }
}
