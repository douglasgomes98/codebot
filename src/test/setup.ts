// Setup global para testes
import 'jest';

// Mock global do console para evitar logs desnecessários durante os testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};