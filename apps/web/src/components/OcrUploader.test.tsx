import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { OcrUploader } from './OcrUploader';
import * as ocrCore from '@core-nexus/ocr-core';

// Mock recognize function
vi.mock('@core-nexus/ocr-core', () => ({
  processFileWithOcr: vi.fn(),
  detectFileType: vi.fn(),
}));

describe('OcrUploader', () => {
  it('renders upload button and instructions', () => {
    render(<OcrUploader />);
    expect(screen.getByText(/파일 선택/i)).toBeInTheDocument();
    expect(screen.getByText(/이미지 또는 PDF 파일을 선택하세요/i)).toBeInTheDocument();
  });

  it('handles file selection and shows preview', async () => {
    const user = userEvent.setup();
    render(<OcrUploader />);

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/파일 선택/i);

    await user.upload(input, file);

    expect(screen.getByText(/test.png/i)).toBeInTheDocument();
  });

  it('calls OCR process when recognize button is clicked', async () => {
    const user = userEvent.setup();
    const mockProcess = vi.mocked(ocrCore.processFileWithOcr);
    mockProcess.mockResolvedValue({
      text: 'Detected Text',
      confidence: 90,
      blocks: [],
    });

    render(<OcrUploader />);

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/파일 선택/i);
    await user.upload(input, file);

    const recognizeButton = screen.getByRole('button', { name: /인식하기/i });
    await user.click(recognizeButton);

    expect(screen.getByText(/처리 중.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockProcess).toHaveBeenCalledWith(file, expect.anything());
      expect(screen.getByText('Detected Text')).toBeInTheDocument();
    });
  });

  it('displays error message when OCR fails', async () => {
    const user = userEvent.setup();
    const mockProcess = vi.mocked(ocrCore.processFileWithOcr);
    mockProcess.mockRejectedValue(new Error('OCR Failed'));

    render(<OcrUploader />);

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/파일 선택/i);
    await user.upload(input, file);

    const recognizeButton = screen.getByRole('button', { name: /인식하기/i });
    await user.click(recognizeButton);

    await waitFor(() => {
      expect(screen.getByText(/OCR Failed/i)).toBeInTheDocument();
    });
  });
});
