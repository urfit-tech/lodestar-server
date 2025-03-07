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
    .map((key) => `${key}: ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`)
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
  (keyMap) =>
  (list) => {
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

export const parseStringSplitValue = (splittingChar: string) => (data: string[]) => {
  const rawArrays = map(split(splittingChar))(data);
  const keys = head(rawArrays);
  const vals = pipe(tail, transpose)(rawArrays);
  return map(zipObj(keys))(vals);
};
