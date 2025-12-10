import type { OcrInput, OcrOptions, OcrResult } from './types';
import * as Tesseract from 'tesseract.js';

export interface OcrEngineAdapter {
  recognize(input: OcrInput, options?: OcrOptions): Promise<OcrResult>;
}

export class StubEngine implements OcrEngineAdapter {
  async recognize(_input: OcrInput, _options?: OcrOptions): Promise<OcrResult> {
    // Simulate OCR processing delay (allows timeout tests to race)
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      text: '',
      confidence: 0,
      blocks: [],
    };
  }
}

export class TesseractEngine implements OcrEngineAdapter {
  async recognize(input: OcrInput, options: OcrOptions = {}): Promise<OcrResult> {
    const language = options.language || 'eng';

    const worker = await Tesseract.createWorker(language);

    try {
      const {
        data: { text, confidence, blocks },
      } = await worker.recognize(input as string | Blob | File);

      return {
        text: text.trim(),
        confidence: confidence || 0,
        blocks: blocks?.map((block) => ({
          text: block.text,
          boundingBox: [
            block.bbox.x0,
            block.bbox.y0,
            block.bbox.x1 - block.bbox.x0,
            block.bbox.y1 - block.bbox.y0,
          ] as [number, number, number, number],
          confidence: block.confidence || 0,
        })),
      };
    } finally {
      await worker.terminate();
    }
  }
}
