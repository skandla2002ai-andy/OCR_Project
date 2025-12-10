import { describe, it, expect } from 'vitest';
import { processFileWithOcr } from '../src/pipelines/filePipeline';
import * as fs from 'fs';
import * as path from 'path';

describe('processFileWithOcr - unified API', () => {
  it('routes image files to image pipeline', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'sample.png');
    const imageBuffer = fs.readFileSync(fixturePath);
    const file = new File([imageBuffer], 'sample.png', { type: 'image/png' });

    const result = await processFileWithOcr(file);
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');
  });

  it('routes PDF files to PDF pipeline', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'sample-text.pdf');
    const pdfBuffer = fs.readFileSync(fixturePath);
    const file = new File([pdfBuffer], 'sample.pdf', { type: 'application/pdf' });

    const result = await processFileWithOcr(file);
    expect(result.text).toContain('TEST PDF');
  });

  it('throws error for unsupported file types', async () => {
    const file = new File([], 'test.txt', { type: 'text/plain' });
    await expect(processFileWithOcr(file)).rejects.toThrow('Unsupported file type');
  });

  it('handles different image formats', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'sample.png');
    const imageBuffer = fs.readFileSync(fixturePath);

    const jpgFile = new File([imageBuffer], 'test.jpg', { type: 'image/jpeg' });
    const result = await processFileWithOcr(jpgFile);
    expect(result).toHaveProperty('text');
  });
});
