import dayjs from 'dayjs';

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
