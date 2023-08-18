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
