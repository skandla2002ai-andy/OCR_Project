import { describe, it, expect, expectTypeOf } from 'vitest';
import { recognize, OcrError } from '../src';

describe('recognize (stub)', () => {
  it('returns empty text and zero confidence', async () => {
    const result = await recognize('dummy');
    expect(result.text).toBe('');
    expect(result.confidence).toBe(0);
    expect(result.blocks).toEqual([]);
  });

  it('has correct type shape', async () => {
    const result = await recognize('dummy');
    expectTypeOf(result.text).toEqualTypeOf<string>();
    expectTypeOf(result.confidence).toEqualTypeOf<number>();
  });

  it('accepts options shape without throwing', async () => {
    const result = await recognize(new ArrayBuffer(0), {
      language: 'eng',
      detectOrientation: true,
      enhanceContrast: true,
      timeoutMs: 1000,
    });
    expect(result).toHaveProperty('text');
  });

  it('rejects invalid input', async () => {
    await expect(recognize(123 as unknown as string)).rejects.toBeInstanceOf(OcrError);
  });

  it('respects timeout option', async () => {
    await expect(recognize('dummy', { timeoutMs: 1 })).rejects.toBeInstanceOf(OcrError);
  });
});
