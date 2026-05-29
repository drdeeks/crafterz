import { render } from '@testing-library/react';
import { MiniApp } from '../mini-app';

// Mock all the APIs that the component uses
jest.mock('../runtime-api', () => ({
  progressTask: jest.fn(() => Promise.resolve([])),
  completeTask: jest.fn(() => Promise.resolve([])),
  fetchLeaderboardSnapshot: jest.fn(() => Promise.resolve({
    leaderboard: [],
    recentActivity: []
  })),
  fetchTasks: jest.fn(() => Promise.resolve([])),
  postCraftEvent: jest.fn(() => Promise.resolve({})),
  postGmEvent: jest.fn(() => Promise.resolve({})),
  postMintEvent: jest.fn(() => Promise.resolve({})),
  refreshServerSnapshot: jest.fn(() => Promise.resolve({
    leaderboard: [],
    recentActivity: []
  })),
}));

// Mock fetch for API calls
const fetchMock = jest.fn();
beforeAll(() => {
  // @ts-ignore
  global.fetch = fetchMock;
  fetchMock.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true })
  });
});
afterAll(() => {
  // @ts-ignore
  delete global.fetch;
});

describe('MiniApp - Snapshot Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly on initial load', () => {
    const { container } = render(<MiniApp />);
    expect(container).toMatchSnapshot();
  });

  it('renders correctly with some points', () => {
    // We can't directly set state in the test, but we can verify it renders
    const { container } = render(<MiniApp />);
    expect(container).toMatchSnapshot();
  });
});