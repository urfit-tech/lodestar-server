import { EntityManager } from 'typeorm';
import { Currency } from '~/entity/Currency';
import { faker } from '@faker-js/faker';

export const createTestCurrency = async (
  entityManager: EntityManager,
  overrides: Partial<Currency> = {},
): Promise<Currency> => {
  const currency = new Currency();
  currency.id = overrides.id || 'TWD';
  currency.minorUnits = overrides.minorUnits !== undefined ? overrides.minorUnits : 2;
  currency.label = overrides.label || 'default';
  currency.unit = overrides.unit || 'default';
  currency.name = overrides.name || 'default';

  await entityManager.save(currency);
  return currency;
};
