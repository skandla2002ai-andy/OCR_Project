import { describe, it, expect } from 'vitest';
import { processFileWithOcr } from '../src/pipelines/filePipeline';
import { setOcrConfig } from '../src/config/ocrConfig';

describe('Office file processing', () => {
  it('throws error when office integration is not configured', async () => {
    setOcrConfig({ officeIntegration: undefined });

    const docxFile = new File([], 'test.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    await expect(processFileWithOcr(docxFile)).rejects.toThrow('Office integration not configured');
  });

  it('throws error for Excel files without office integration', async () => {
    setOcrConfig({ officeIntegration: undefined });

    const xlsxFile = new File([], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    await expect(processFileWithOcr(xlsxFile)).rejects.toThrow('Office integration not configured');
  });

  it('throws error for PowerPoint files without office integration', async () => {
    setOcrConfig({ officeIntegration: undefined });

    const pptxFile = new File([], 'test.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });

    await expect(processFileWithOcr(pptxFile)).rejects.toThrow('Office integration not configured');
  });
});
