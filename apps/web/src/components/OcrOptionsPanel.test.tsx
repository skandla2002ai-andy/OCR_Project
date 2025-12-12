import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OcrOptionsPanel } from './OcrOptionsPanel';
import { OcrOptions } from '@core-nexus/ocr-core';

describe('OcrOptionsPanel', () => {
  const defaultOptions: OcrOptions = {
    language: 'eng',
    detectOrientation: false,
    enhanceContrast: false,
  };

  const mockOnChange = vi.fn();

  it('renders language selector and checkboxes', () => {
    render(<OcrOptionsPanel options={defaultOptions} onChange={mockOnChange} />);

    expect(screen.getByLabelText(/언어/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/방향 자동 감지/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/대비 향상/i)).toBeInTheDocument();
  });

  it('calls onChange when language is changed', async () => {
    const user = userEvent.setup();
    render(<OcrOptionsPanel options={defaultOptions} onChange={mockOnChange} />);

    const select = screen.getByLabelText(/언어/i);
    await user.selectOptions(select, 'kor');

    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ language: 'kor' }));
  });

  it('calls onChange when checkboxes are toggled', async () => {
    const user = userEvent.setup();
    render(<OcrOptionsPanel options={defaultOptions} onChange={mockOnChange} />);

    const orientationCheckbox = screen.getByLabelText(/방향 자동 감지/i);
    await user.click(orientationCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ detectOrientation: true }));

    const contrastCheckbox = screen.getByLabelText(/대비 향상/i);
    await user.click(contrastCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ enhanceContrast: true }));
  });
});
