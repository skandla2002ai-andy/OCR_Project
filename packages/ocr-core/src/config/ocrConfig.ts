export interface OcrEngineConfig {
  ocrEngine: 'tesseract-js';
  pdfRenderer: 'pdfjs';
  officeIntegration?: 'apryse-webviewer' | 'nutrient-websdk';
}

const defaultConfig: OcrEngineConfig = {
  ocrEngine: 'tesseract-js',
  pdfRenderer: 'pdfjs',
  officeIntegration: undefined,
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
