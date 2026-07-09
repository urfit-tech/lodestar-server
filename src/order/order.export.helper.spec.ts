import { buildPaymentMethodDisplayMap, resolvePaymentMethodDisplay } from './order.export.helper';

describe('order export payment method helpers', () => {
  const methods = [
    { name: 'credit', displayName: '信用卡' },
    { name: 'ApplePay', displayName: 'Apple Pay' },
    { name: 123 as any, displayName: 'bogus' }, // non-string name ignored
    { name: 'noDisplay' } as any,
  ];

  it('builds a lowercased name -> display map, skipping non-string names', () => {
    const map = buildPaymentMethodDisplayMap(methods);
    expect(map.get('credit')).toBe('信用卡');
    expect(map.get('applepay')).toBe('Apple Pay');
    expect(map.has('nodisplay')).toBe(true); // matched, but stores undefined displayName
    expect(map.get('nodisplay')).toBeUndefined();
    expect([...map.keys()]).not.toContain(123);
  });

  it('resolves display name case-insensitively', () => {
    const map = buildPaymentMethodDisplayMap(methods);
    expect(resolvePaymentMethodDisplay('CREDIT', map)).toBe('信用卡');
    expect(resolvePaymentMethodDisplay('applepay', map)).toBe('Apple Pay');
  });

  it('falls back to the raw method string when unmatched', () => {
    const map = buildPaymentMethodDisplayMap(methods);
    expect(resolvePaymentMethodDisplay('unknown', map)).toBe('unknown');
  });

  it('returns empty string for a matched method with no displayName', () => {
    const map = buildPaymentMethodDisplayMap(methods);
    // Behavior-preserving: original inline code returned paymentMethod.displayName,
    // which is undefined here and becomes '' after .join('\n').
    expect(resolvePaymentMethodDisplay('noDisplay', map)).toBe('');
  });

  it('returns the value (or empty string) for non-string methods', () => {
    const map = buildPaymentMethodDisplayMap(methods);
    expect(resolvePaymentMethodDisplay(null, map)).toBe('');
    expect(resolvePaymentMethodDisplay(undefined, map)).toBe('');
    expect(resolvePaymentMethodDisplay(42 as any, map)).toBe(42);
  });

  it('keeps the first entry on duplicate case-insensitive names (matches .find semantics)', () => {
    const map = buildPaymentMethodDisplayMap([
      { name: 'Credit', displayName: 'A' },
      { name: 'credit', displayName: 'B' },
    ]);
    expect(resolvePaymentMethodDisplay('credit', map)).toBe('A');
  });

  it('treats an explicit null displayName as matched-with-empty', () => {
    const map = buildPaymentMethodDisplayMap([{ name: 'x', displayName: null as any }]);
    expect(map.has('x')).toBe(true);
    expect(resolvePaymentMethodDisplay('x', map)).toBe('');
  });
});
