import { describe, it, expect } from 'vitest';
import { processPdfWithOcr } from '../src/pipelines/pdfPipeline';
import * as fs from 'fs';
import * as path from 'path';

describe('processPdfWithOcr', () => {
  it('extracts text from text-based PDF', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'sample-text.pdf');
    const pdfBuffer = fs.readFileSync(fixturePath);
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });

    const result = await processPdfWithOcr(blob);

    expect(result.text).toContain('TEST PDF');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  it('handles File input', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'sample-text.pdf');
    const pdfBuffer = fs.readFileSync(fixturePath);
    const file = new File([pdfBuffer], 'sample.pdf', { type: 'application/pdf' });

    const result = await processPdfWithOcr(file);
    expect(result).toHaveProperty('text');
  });
});
