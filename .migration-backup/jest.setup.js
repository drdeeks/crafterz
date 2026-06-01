// jest.setup.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { configure } = require('@testing-library/react');

// Mock Next.js specific features
global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock matchMedia for components that use it
global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
};

// Mock ResizeObserver for components that use it
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();
