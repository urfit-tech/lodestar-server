import dayjs from 'dayjs';
import {
  always,
  append,
  apply,
  converge,
  evolve,
  flip,
  head,
  identity,
  map,
  multiply,
  pipe,
  props,
  split,
  sum,
  tail,
  transpose,
  zipObj,
} from 'ramda';

export function getMemoryUsageString(): string {
  const used = process.memoryUsage();
  const output = Object.keys(used)
    .map(key => `${key}: ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`)
    .join(',');
  return `[MemoryUsage] ${output}`;
}

export function isEmptyString(value: string): boolean {
  return value === '';
}

export function isNullString(value: string): boolean {
  return ['null', 'N/A'].includes(value);
}

export function parseFieldFromRaw<T>(
  value: string | undefined,
  parser: (value: string) => T = (value: string) => value as T,
): T {
  return isEmptyString(value) || value === undefined ? undefined : parser(value);
}

export function parseNullableFieldFromRaw<T>(
  value: string | undefined,
  parser: (value: string) => T = (value: string) => value as T,
): T {
  return isEmptyString(value) || value === undefined ? undefined : isNullString(value) ? null : parser(value);
}

export const digitalCodeGenerator = (num: number) => {
  return Math.floor(1 + Math.random() * parseInt('9'.repeat(num)))
    .toString()
    .padStart(num, '0');
};

export function parseDateStringFieldFromRaw<T>(
  value: string | undefined,
  parser: (value: string) => T = (value: string) => value as T,
): T {
  return isEmptyString(value) || value === undefined || isNullString(value)
    ? null
    : dayjs(value).isValid()
    ? parser(dayjs(value).toISOString())
    : parser(value);
}

export const getBrowserByUserAgent = (userAgent: string) => {
  if (userAgent.includes('Edg/')) {
    return 'Microsoft Edge';
  } else if (userAgent.includes('Chrome/')) {
    return 'Google Chrome';
  } else if (userAgent.includes('Firefox/')) {
    return 'Mozilla Firefox';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
    return 'Apple Safari';
  } else if (userAgent.includes('OPR/') || userAgent.includes('Opera/')) {
    return 'Opera';
  } else {
    return 'Unknown Browser';
  }
};

type RoundMethod = 'round' | 'ceil' | 'floor';
export type RoundMethodsForCompensation = {
  itemNumberRoundMethod: RoundMethod;
  itemQuantityRoundMethod: RoundMethod;
  totalRoundMethod: RoundMethod;
};
type ItemForCompensation = { number: number; quantity: number; amount: number };

export const getRoundedListWithCompensation: <T extends Record<string, any>, K extends keyof T>(
  roundMethods: RoundMethodsForCompensation,
) => (keyMap: Record<keyof ItemForCompensation, K>) => (list: T[]) => { roundedList: T[]; compensationItem: any } =
  ({ itemNumberRoundMethod, itemQuantityRoundMethod, totalRoundMethod }) =>
  keyMap =>
  list => {
    const getTargetKeys = flip(props)(keyMap) as any;
    const getAmt = pipe((props as any)(getTargetKeys(['number', 'quantity'])), apply(multiply));
    const roundedList = map(
      pipe(
        evolve(
          zipObj(getTargetKeys(['number', 'quantity']), [Math[itemNumberRoundMethod], Math[itemQuantityRoundMethod]]),
        ),
        converge(evolve, [
          (converge as any)(zipObj, [always(getTargetKeys(['amount'])), pipe(getAmt, always, flip(append)([]))]),
          identity,
        ]),
      ),
    )(list) as any;

    const getTotal = pipe(map(getAmt), sum);
    const compensation = getTotal(roundedList) - Math[totalRoundMethod](getTotal(list));
    const compensationItem =
      compensation > 0
        ? zipObj(getTargetKeys(['number', 'quantity', 'amount']), [compensation, 1, compensation])
        : undefined;

    return {
      roundedList,
      compensationItem,
    };
  };

type InvoiceLineNumbers = { ItemCount: number; ItemPrice: number; ItemAmt: number };

/**
 * Rewrites an invoice line in whole numbers without changing its rounded total.
 * A decimal unit price keeps its quantity by splitting: 9 x 533.33 becomes 6 x 533 + 3 x 534.
 * A fractional quantity has no whole-number form, so 23.5 x 1020 becomes 1 x 23970.
 */
export const splitIntoWholeNumberLines = <T extends InvoiceLineNumbers>(line: T): T[] => {
  const { ItemCount: count, ItemPrice: price } = line;
  const toLine = (itemCount: number, itemPrice: number): T => ({
    ...line,
    ItemCount: itemCount,
    ItemPrice: itemPrice,
    ItemAmt: itemCount * itemPrice,
  });

  if (Number.isInteger(count) && Number.isInteger(price)) {
    return [toLine(count, price)];
  }

  const lineTotal = Math.round(count * price);
  const quantity = Number.isInteger(count) && count > 0 ? count : 1;
  const lowerPrice = Math.floor(lineTotal / quantity);
  const higherPriceCount = lineTotal - lowerPrice * quantity;

  return higherPriceCount > 0
    ? [toLine(quantity - higherPriceCount, lowerPrice), toLine(higherPriceCount, lowerPrice + 1)]
    : [toLine(quantity, lowerPrice)];
};

export const parseStringSplitValue = (splittingChar: string) => (data: string[]) => {
  const rawArrays = map(split(splittingChar))(data);
  const keys = head(rawArrays);
  const vals = pipe(tail, transpose)(rawArrays);
  return map(zipObj(keys))(vals);
};
