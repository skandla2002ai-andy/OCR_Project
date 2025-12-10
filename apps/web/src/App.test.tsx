import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders OCR Web App headline', () => {
    render(<App />);
    expect(screen.getByText(/OCR Web App/i)).toBeInTheDocument();
  });
});
