// Setup for React Native Testing Library
// Note: @testing-library/react-native v12.4+ includes built-in Jest matchers

// Mock AsyncStorage with isolated storage for each test
let mockStorage: Record<string, string> = {};

// Create a new storage instance for complete isolation
const createIsolatedStorage = () => {
  const isolatedStorage: Record<string, string> = {};
  return {
    setItem: jest.fn((key: string, value: string) => {
      isolatedStorage[key] = value;
      return Promise.resolve();
    }),
    getItem: jest.fn((key: string) => {
      return Promise.resolve(isolatedStorage[key] || null);
    }),
    removeItem: jest.fn((key: string) => {
      delete isolatedStorage[key];
      return Promise.resolve();
    }),
    multiRemove: jest.fn((keys: string[]) => {
      keys.forEach(key => delete isolatedStorage[key]);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(isolatedStorage).forEach(key => delete isolatedStorage[key]);
      return Promise.resolve();
    }),
  };
};

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
  getItem: jest.fn((key: string) => {
    return Promise.resolve(mockStorage[key] || null);
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStorage[key];
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys: string[]) => {
    keys.forEach(key => delete mockStorage[key]);
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    return Promise.resolve();
  }),
}));

// Export functions to reset mock state for tests
(global as any).clearMockStorage = () => {
  Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
};

(global as any).createIsolatedStorage = createIsolatedStorage;

(global as any).resetMockCrypto = () => {
  const mockCrypto = require('expo-crypto');
  if (mockCrypto.resetCounters) {
    mockCrypto.resetCounters();
  }
};

// Global cleanup before each test to prevent interference
beforeEach(() => {
  // Reset crypto counters for consistent UUIDs (but don't clear storage here)
  (global as any).resetMockCrypto?.();

  // Don't clear all mocks globally as it interferes with storage state
  // Individual tests should clear their own mocks if needed
});

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
  NativeModulesProxy: {},
  EventEmitter: jest.fn(),
  requireNativeModule: jest.fn(),
}));

// Mock expo-crypto with more realistic values
jest.mock('expo-crypto', () => {
  let uuidCounter = 0;
  let hashCounter = 0;

  const mockCrypto = {
    randomUUID: jest.fn(() => {
      uuidCounter++;
      return `550e8400-e29b-41d4-a716-44665544000${uuidCounter}`;
    }),
    digestStringAsync: jest.fn(() => {
      hashCounter++;
      return Promise.resolve(`dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjX${hashCounter}=`);
    }),
    CryptoDigestAlgorithm: {
      SHA256: 'SHA256',
    },
    CryptoEncoding: {
      BASE64: 'BASE64',
    },
  };

  // Add reset function to the mock
  mockCrypto.resetCounters = () => {
    uuidCounter = 0;
    hashCounter = 0;
  };

  return mockCrypto;
});

// Mock expo-auth-session
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'myapp://oauth/callback'),
  AuthRequest: jest.fn(),
  AuthSession: {
    AuthRequestConfig: {},
  },
}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
  dismissBrowser: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    headers: new Map([['content-type', 'application/json']]),
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
) as jest.Mock;

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
        args[0].includes('componentWillUpdate'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
