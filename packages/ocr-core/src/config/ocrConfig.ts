export interface OcrEngineConfig {
  ocrEngine: 'tesseract-js';
  pdfRenderer: 'pdfjs';
}

const defaultConfig: OcrEngineConfig = {
  ocrEngine: 'tesseract-js',
  pdfRenderer: 'pdfjs',
};

let currentConfig: OcrEngineConfig = { ...defaultConfig };

export function getOcrConfig(): OcrEngineConfig {
  return { ...currentConfig };
}

export function setOcrConfig(partial: Partial<OcrEngineConfig>): void {
  currentConfig = { ...currentConfig, ...partial };
}

export function resetOcrConfig(): void {
  currentConfig = { ...defaultConfig };
}
