// Must stay .cjs: Jest loads a .ts config through ts-node, which cannot run under TypeScript 7.
// Transform is @swc/jest, not ts-jest — ts-jest peer-caps TypeScript at <7.
const common = {
  testEnvironment: 'node',
  transform: { '^.+\\.(t|j)s$': ['@swc/jest'] },
  // uuid v14 is ESM-only, so it has to go through the transform like our own sources.
  // The separator class keeps this working on Windows paths too.
  transformIgnorePatterns: ['node_modules[/\\\\](?!uuid[/\\\\])'],
  // tsconfig paths are not read by Jest, so the five layer aliases are mirrored here.
  moduleNameMapper: {
    // NodeNext sources (incl. Prisma's generated client) import siblings as ".js"; Jest needs the
    // extension dropped so it resolves the real ".ts" file.
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@shared-kernel/(.*)$': '<rootDir>/src/shared-kernel/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
  },
};

/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  projects: [
    { ...common, displayName: 'unit', testMatch: ['<rootDir>/src/**/*.spec.ts'] },
    {
      ...common,
      displayName: 'integration',
      testMatch: ['<rootDir>/test/**/*.spec.ts'],
      setupFiles: ['<rootDir>/test/setup.ts'],
    },
  ],
};
