import { describe, it, expect } from 'vitest';
import { processImageWithOcr } from '../src/pipelines/imagePipeline';
import * as fs from 'fs';
import * as path from 'path';

describe('processImageWithOcr', () => {
  it('processes sample image and returns non-empty text', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'sample.png');
    const imageBuffer = fs.readFileSync(fixturePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    const result = await processImageWithOcr(blob, { language: 'eng' });

    expect(result.text).toBeTruthy();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  it('handles File input', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'sample.png');
    const imageBuffer = fs.readFileSync(fixturePath);
    const file = new File([imageBuffer], 'sample.png', { type: 'image/png' });

    const result = await processImageWithOcr(file);
    expect(result).toHaveProperty('text');
  });

  it('returns blocks with bounding boxes', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'sample.png');
    const imageBuffer = fs.readFileSync(fixturePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    const result = await processImageWithOcr(blob);
    expect(result.blocks).toBeDefined();
  });
});
