import type { OcrInput, OcrOptions, OcrResult } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import { processImageWithOcr } from './imagePipeline';

// Set worker path for PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

async function extractTextFromPdf(pdfData: ArrayBuffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? (item as { str: string }).str : ''))
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n').trim();
}

async function renderPdfPageToBlob(pdfData: ArrayBuffer, pageNum: number): Promise<Blob> {
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 2.0 });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const renderContext = {
    canvasContext: context,
    viewport,
  };

  // @ts-expect-error - 'canvas' property check in types is too strict for pdfjs-dist
  await page.render(renderContext).promise;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

async function convertInputToArrayBuffer(input: OcrInput): Promise<ArrayBuffer> {
  if (input instanceof ArrayBuffer) {
    return input;
  }

  // Handle string inputs (URL or base64)
  if (typeof input === 'string') {
    if (input.startsWith('data:')) {
      // base64 decode
      const base64 = input.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    }
    // Assume URL
    const response = await fetch(input);
    return response.arrayBuffer();
  }

  // Handle Blob/File
  if (typeof Blob !== 'undefined') {
    // Type assertion: at this point input must be Blob or File (not string or ArrayBuffer)
    return input.arrayBuffer();
  }

  throw new Error('Unsupported input type for PDF processing');
}

/**
 * Process PDF with text extraction (priority) and OCR fallback
 */
export async function processPdfWithOcr(input: OcrInput, options?: OcrOptions): Promise<OcrResult> {
  const arrayBuffer = await convertInputToArrayBuffer(input);

  // Try text extraction first
  const extractedText = await extractTextFromPdf(arrayBuffer);

  if (extractedText && extractedText.length > 10) {
    // Text layer exists, use it
    return {
      text: extractedText,
      confidence: 100, // High confidence for text layer
      blocks: [],
    };
  }

  // Fallback to OCR (render first page as image)
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const ocrResults: OcrResult[] = [];

  for (let i = 1; i <= numPages; i++) {
    const pageBlob = await renderPdfPageToBlob(arrayBuffer, i);
    const pageResult = await processImageWithOcr(pageBlob, options);
    ocrResults.push(pageResult);
  }

  // Combine results
  const combinedText = ocrResults.map((r) => r.text).join('\n\n');
  const avgConfidence =
    ocrResults.reduce((sum, r) => sum + r.confidence, 0) / ocrResults.length || 0;

  return {
    text: combinedText,
    confidence: avgConfidence,
    blocks: ocrResults.flatMap((r) => r.blocks || []),
  };
}
