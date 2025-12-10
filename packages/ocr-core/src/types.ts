export type OcrInput = File | Blob | ArrayBuffer | string;

export interface OcrOptions {
  language?: string;
  detectOrientation?: boolean;
  enhanceContrast?: boolean;
  timeoutMs?: number;
}

export interface OcrBlock {
  text: string;
  boundingBox: [number, number, number, number]; // x, y, w, h
  confidence: number;
}

export interface OcrResult {
  text: string;
  confidence: number;
  blocks?: OcrBlock[];
}
