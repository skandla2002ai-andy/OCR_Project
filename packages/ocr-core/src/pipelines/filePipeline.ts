import type { OcrOptions, OcrResult } from '../types';
import { OcrError } from '../errors';
import { detectFileType } from '../utils/fileType';
import { getOcrConfig } from '../config/ocrConfig';
import { processImageWithOcr } from './imagePipeline';
import { processPdfWithOcr } from './pdfPipeline';

/**
 * Unified API to process any supported file type with OCR
 */
export async function processFileWithOcr(file: File, options?: OcrOptions): Promise<OcrResult> {
  const fileType = detectFileType(file);
  const config = getOcrConfig();

  switch (fileType) {
    case 'image':
      return processImageWithOcr(file, options);

    case 'pdf':
      return processPdfWithOcr(file, options);

    case 'word':
    case 'excel':
    case 'ppt':
      if (!config.officeIntegration) {
        throw new OcrError(
          'UNSUPPORTED_FORMAT',
          'Office integration not configured. Please set officeIntegration in config.'
        );
      }
      // TODO: Implement office conversion adapters
      throw new OcrError('NOT_IMPLEMENTED', 'Office file processing not yet implemented');

    case 'unknown':
    default:
      throw new OcrError('UNSUPPORTED_FORMAT', `Unsupported file type: ${file.name}`);
  }
}
