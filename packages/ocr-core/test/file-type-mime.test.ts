import { describe, it, expect } from 'vitest';
import { detectFileType } from '../src/utils/fileType';

describe('detectFileType - MIME type priority', () => {
  it('uses MIME type over extension when both available', () => {
    // PDF file with wrong extension
    const file = new File([], 'test.txt', { type: 'application/pdf' });
    expect(detectFileType(file)).toBe('pdf');
  });

  it('detects image from MIME type', () => {
    const jpegFile = new File([], 'photo', { type: 'image/jpeg' });
    expect(detectFileType(jpegFile)).toBe('image');

    const pngFile = new File([], 'screenshot', { type: 'image/png' });
    expect(detectFileType(pngFile)).toBe('image');
  });

  it('detects Office files from MIME type', () => {
    const docxFile = new File([], 'document.xyz', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    expect(detectFileType(docxFile)).toBe('word');

    const xlsxFile = new File([], 'spreadsheet.xyz', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    expect(detectFileType(xlsxFile)).toBe('excel');

    const pptxFile = new File([], 'presentation.xyz', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
    expect(detectFileType(pptxFile)).toBe('ppt');
  });

  it('falls back to extension when MIME type is missing', () => {
    const file = new File([], 'test.pdf', { type: '' });
    expect(detectFileType(file)).toBe('pdf');
  });

  it('detects generic image MIME types', () => {
    const file = new File([], 'photo', { type: 'image/svg+xml' });
    expect(detectFileType(file)).toBe('image');
  });

  it('handles files with no extension', () => {
    const file = new File([], 'README', { type: '' });
    expect(detectFileType(file)).toBe('unknown');
  });
});
