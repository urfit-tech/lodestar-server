import { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*.spec.ts$',
  transform: {
    '^.+.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.ts'],
  coveragePathIgnorePatterns: ['<rootDir>/src/entity/*', '.spec.ts', '.entity.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/../src/$1',
  },
};

export default config;
