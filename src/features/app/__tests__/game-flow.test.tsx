import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
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

describe('Game Flow - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without throwing an error', async () => {
    // Render the component
    render(<MiniApp />);
    
    // Check for basic elements - looking for pts text instead of "Points:"
    expect(screen.getByText(/pts/i)).toBeInTheDocument();
    
    // Also check that we have the main components
    expect(screen.getByText(/crafterz/i)).toBeInTheDocument();
    expect(screen.getByText(/craftz/i)).toBeInTheDocument();
  });
});