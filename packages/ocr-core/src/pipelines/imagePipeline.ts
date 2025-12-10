import type { OcrInput, OcrOptions, OcrResult } from '../types';
import { TesseractEngine } from '../engine';

const tesseractEngine = new TesseractEngine();

/**
 * Process image input with OCR using Tesseract.js
 */
export async function processImageWithOcr(
  input: OcrInput,
  options?: OcrOptions
): Promise<OcrResult> {
  return tesseractEngine.recognize(input, options);
}
