import type { OcrOptions, OcrResult } from '../types';
import { OcrError } from '../errors';
import { detectFileType } from '../utils/fileType';
import { processImageWithOcr } from './imagePipeline';
import { processPdfWithOcr } from './pdfPipeline';
import { processOfficeFileWithOcr } from './officePipeline';

/**
 * Unified API to process any supported file type with OCR
 */
export async function processFileWithOcr(file: File, options?: OcrOptions): Promise<OcrResult> {
  const fileType = detectFileType(file);

  switch (fileType) {
    case 'image':
      return processImageWithOcr(file, options);

    case 'pdf':
      return processPdfWithOcr(file, options);

    case 'word':
    case 'excel':
    case 'ppt':
      return processOfficeFileWithOcr(file);

    case 'unknown':
    default:
      throw new OcrError('UNSUPPORTED_FORMAT', `Unsupported file type: ${file.name}`);
  }
}
