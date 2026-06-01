import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Test basic component rendering
describe('Basic Component Tests', () => {
  it('renders a simple div', () => {
    const Component = () => <div data-testid="test">Hello World</div>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('test')).toHaveTextContent('Hello World');
  });

  it('renders a button with click handler', () => {
    const handleClick = jest.fn();
    const Component = () => (
      <button onClick={handleClick} data-testid="test-button">
        Click Me
      </button>
    );
    const { getByTestId } = render(<Component />);
    expect(getByTestId('test-button')).toHaveTextContent('Click Me');
    
    fireEvent.click(getByTestId('test-button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows and hides elements based on state', () => {
    const Component = () => {
      const [show, setShow] = React.useState(false);
      return (
        <div>
          <button onClick={() => setShow(true)} data-testid="show-button">
            Show
          </button>
          {show && <div data-testid="conditional-content">Visible Content</div>}
        </div>
      );
    };
    
    const { getByTestId, queryByTestId } = render(<Component />);
    
    // Initially hidden
    expect(queryByTestId('conditional-content')).not.toBeInTheDocument();
    
    // Click show button
    fireEvent.click(getByTestId('show-button'));
    
    // Now visible
    expect(getByTestId('conditional-content')).toHaveTextContent('Visible Content');
  });
});

// Test utility functions if they exist
describe('Utility Functions', () => {
  it('can import and use basic utilities', () => {
    // This is a placeholder test to ensure our test environment works
    expect(true).toBe(true);
    expect(1 + 1).toBe(2);
    expect('hello').toContain('ell');
  });
});
