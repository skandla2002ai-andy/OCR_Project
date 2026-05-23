import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface PdfLoadResult {
  blobUrl: string;
  pageCount: number;
  text: string;
}

export async function loadPdf(file: File): Promise<PdfLoadResult> {
  const blobUrl = URL.createObjectURL(file);

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pageCount = pdf.numPages;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();
    if (pageText) pageTexts.push(pageText);
  }

  return { blobUrl, pageCount, text: pageTexts.join('\n\n') };
}

export function revokePdfUrl(blobUrl: string): void {
  URL.revokeObjectURL(blobUrl);
}
