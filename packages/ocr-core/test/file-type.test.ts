import { describe, it, expect } from 'vitest';
import { detectFileType } from '../src/utils/fileType';

describe('detectFileType', () => {
  it('detects image files', () => {
    expect(detectFileType(new File([], 'test.jpg'))).toBe('image');
    expect(detectFileType(new File([], 'test.jpeg'))).toBe('image');
    expect(detectFileType(new File([], 'test.png'))).toBe('image');
    expect(detectFileType(new File([], 'test.gif'))).toBe('image');
    expect(detectFileType(new File([], 'test.webp'))).toBe('image');
  });

  it('detects PDF files', () => {
    expect(detectFileType(new File([], 'test.pdf'))).toBe('pdf');
  });

  it('detects Word files', () => {
    expect(detectFileType(new File([], 'test.doc'))).toBe('word');
    expect(detectFileType(new File([], 'test.docx'))).toBe('word');
  });

  it('detects Excel files', () => {
    expect(detectFileType(new File([], 'test.xls'))).toBe('excel');
    expect(detectFileType(new File([], 'test.xlsx'))).toBe('excel');
  });

  it('detects PowerPoint files', () => {
    expect(detectFileType(new File([], 'test.ppt'))).toBe('ppt');
    expect(detectFileType(new File([], 'test.pptx'))).toBe('ppt');
  });

  it('returns unknown for unsupported file types', () => {
    expect(detectFileType(new File([], 'test.txt'))).toBe('unknown');
    expect(detectFileType(new File([], 'test.zip'))).toBe('unknown');
    expect(detectFileType(new File([], 'test'))).toBe('unknown');
  });

  it('handles uppercase extensions', () => {
    expect(detectFileType(new File([], 'test.JPG'))).toBe('image');
    expect(detectFileType(new File([], 'test.PDF'))).toBe('pdf');
    expect(detectFileType(new File([], 'test.DOCX'))).toBe('word');
  });
});
