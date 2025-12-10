import { describe, it, expect } from 'vitest';
import { getOcrConfig, setOcrConfig } from '../src/config/ocrConfig';

describe('OcrEngineConfig', () => {
  it('has default config with tesseract-js and pdfjs', () => {
    const config = getOcrConfig();
    expect(config.ocrEngine).toBe('tesseract-js');
    expect(config.pdfRenderer).toBe('pdfjs');
    expect(config.officeIntegration).toBeUndefined();
  });

  it('allows setting office integration', () => {
    setOcrConfig({ officeIntegration: 'apryse-webviewer' });
    const config = getOcrConfig();
    expect(config.officeIntegration).toBe('apryse-webviewer');
  });

  it('allows setting office integration to nutrient', () => {
    setOcrConfig({ officeIntegration: 'nutrient-websdk' });
    const config = getOcrConfig();
    expect(config.officeIntegration).toBe('nutrient-websdk');
  });

  it('can reset to default config', () => {
    setOcrConfig({ officeIntegration: 'apryse-webviewer' });
    setOcrConfig({ officeIntegration: undefined });
    const config = getOcrConfig();
    expect(config.officeIntegration).toBeUndefined();
  });
});
