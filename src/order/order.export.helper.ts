export function buildPaymentMethodDisplayMap(
  paymentMethods: Array<{ name: unknown; displayName?: string }>,
): Map<string, string | undefined> {
  const map = new Map<string, string | undefined>();
  for (const pm of paymentMethods) {
    if (typeof pm.name === 'string') {
      const key = pm.name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, pm.displayName);
      }
    }
  }
  return map;
}

export function resolvePaymentMethodDisplay(
  rawMethod: unknown,
  displayMap: Map<string, string | undefined>,
): string {
  if (typeof rawMethod !== 'string') {
    return (rawMethod ?? '') as string;
  }
  const key = rawMethod.toLowerCase();
  if (displayMap.has(key)) {
    return displayMap.get(key) ?? '';
  }
  return rawMethod;
}
