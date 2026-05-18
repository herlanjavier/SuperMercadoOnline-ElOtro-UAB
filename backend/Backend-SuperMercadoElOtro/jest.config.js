export default {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup/testEnv.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  clearMocks: true,
  restoreMocks: true,
};
