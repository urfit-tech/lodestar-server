import { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.benchmark-spec.ts$',
  transform: {
    '^.+\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }]
  },
  // sanitize-html >= 2.18 depends on htmlparser2 12 and its dom/entities packages, which ship only as ES modules.
  // Let ts-jest compile them to CommonJS (tsconfig.jest.json enables allowJs).
  transformIgnorePatterns: [
    '/node_modules/(?!(sanitize-html|htmlparser2|domhandler|domutils|dom-serializer|domelementtype|entities)/)',
  ],
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
