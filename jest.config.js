module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^bcrypt$': require.resolve('bcryptjs'),
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
