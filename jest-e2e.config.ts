import { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\.(t|j)s$': 'ts-jest'
  },
  collectCoverageFrom: [
    "<rootDir>/src/**/*.ts",
  ],
  coveragePathIgnorePatterns: [
    "<rootDir>/src/entity/*",
    ".spec.ts",
    ".e2e-spec.ts",
    ".entity.ts"
  ],
  coverageDirectory: '<rootDir>/coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 20 * 1000,
};

export default config;
