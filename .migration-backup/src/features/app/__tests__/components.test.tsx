import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Component Tests', () => {
  it('renders a simple component', () => {
    const TestComponent = () => <div data-testid="test">Hello World</div>;
    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('test')).toHaveTextContent('Hello World');
  });

  it('handles basic React functionality', () => {
    const Counter = () => {
      const [count, setCount] = React.useState(0);
      return (
        <button onClick={() => setCount(count + 1)} data-testid="counter">
          Count: {count}
        </button>
      );
    };
    
    const { getByTestId } = render(<Counter />);
    expect(getByTestId('counter')).toHaveTextContent('Count: 0');
  });
});
