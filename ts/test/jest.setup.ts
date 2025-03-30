// Set the NODE_ENV to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Add global Jest timeout (for async tests)
jest.setTimeout(10000);

// Mock the logger to avoid console clutter during tests
jest.mock('../src/utils/logging', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));
