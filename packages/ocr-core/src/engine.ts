import type { OcrInput, OcrOptions, OcrResult } from './types';

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
