import { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.benchmark-spec.ts$',
  transform: {
    '^.+\.(t|j)s$': 'ts-jest'
  },
  collectCoverageFrom: [
    "<rootDir>/src/**/*.ts",
  ],
  coveragePathIgnorePatterns: [
    "<rootDir>/src/entity/*",
    ".spec.ts",
    ".entity.ts"
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 10 * 60 * 1000,
};

export default config;
