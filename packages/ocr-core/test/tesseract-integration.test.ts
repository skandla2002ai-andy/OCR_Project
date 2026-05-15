import { describe, it, expect } from 'vitest';
import { recognize } from '../src';
import * as fs from 'fs';
import * as path from 'path';

describe('Tesseract.js Integration (Red)', () => {
  it('recognizes text from sample image fixture', async () => {
    // This test will fail until we integrate Tesseract.js
    const fixturePath = path.join(__dirname, 'fixtures', 'sample.png');
    const imageBuffer = fs.readFileSync(fixturePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    const result = await recognize(blob, { language: 'eng' });

    // Expect actual OCR text (currently will fail with empty stub result)
    expect(result.text).not.toBe('');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('handles File input type', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'sample.png');
    const imageBuffer = fs.readFileSync(fixturePath);

    // Create a File-like object
    const file = new File([imageBuffer], 'sample.png', { type: 'image/png' });

    const result = await recognize(file);
    expect(result.text).not.toBe('');
  });

  it('handles ArrayBuffer input', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'sample.png');
    const imageBuffer = fs.readFileSync(fixturePath);
    const arrayBuffer = imageBuffer.buffer.slice(
      imageBuffer.byteOffset,
      imageBuffer.byteOffset + imageBuffer.byteLength
    );

    const result = await recognize(arrayBuffer);
    expect(result.text).not.toBe('');
  });
});
