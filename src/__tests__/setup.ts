import '@testing-library/jest-dom';

// Mock @stacks/connect
vi.mock('@stacks/connect', () => ({
  openContractCall: vi.fn(),
  showConnect: vi.fn(),
  AppConfig: vi.fn(),
  UserSession: vi.fn(() => ({
    isUserSignedIn: vi.fn(() => false),
    isSignInPending: vi.fn(() => false),
    loadUserData: vi.fn(() => ({ profile: { stxAddress: { mainnet: '' } } })),
  })),
}));

// Mock @stacks/transactions
vi.mock('@stacks/transactions', () => ({
  callReadOnlyFunction: vi.fn(),
  STACKS_MAINNET: { url: 'https://stacks-node-api.mainnet.stacks.co' },
  cvToJSON: vi.fn((cv) => ({ value: cv })),
  uintCV: vi.fn((val) => ({ type: 'uint', value: val })),
  stringAsciiCV: vi.fn((val) => ({ type: 'string-ascii', value: val })),
  boolCV: vi.fn((val) => ({ type: 'bool', value: val })),
  principalCV: vi.fn((val) => ({ type: 'principal', value: val })),
  noneCV: vi.fn(() => ({ type: 'none' })),
  someCV: vi.fn((val) => ({ type: 'some', value: val })),
  AnchorMode: { Any: 3 },
  PostConditionMode: { Allow: 0x01 },
}));
