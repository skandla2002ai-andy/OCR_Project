import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

import type { OcrResult } from '../types';
import { OcrError } from '../errors';
import { getFileExtension } from '../utils/fileType';

// ─── Word (.docx) ─────────────────────────────────────────────────────────────

async function processDocx(arrayBuffer: ArrayBuffer): Promise<OcrResult> {
  const result = await mammoth.extractRawText({ arrayBuffer });
  return {
    text: result.value.trim(),
    confidence: 100,
    blocks: [],
  };
}

// ─── Excel (.xlsx / .xls) ─────────────────────────────────────────────────────

function processExcel(arrayBuffer: ArrayBuffer): OcrResult {
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  const sheetTexts = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    return `[Sheet: ${name}]\n${XLSX.utils.sheet_to_csv(sheet)}`;
  });
  return {
    text: sheetTexts.join('\n\n').trim(),
    confidence: 100,
    blocks: [],
  };
}

// ─── PowerPoint (.pptx) ───────────────────────────────────────────────────────

async function processPptx(arrayBuffer: ArrayBuffer): Promise<OcrResult> {
  const zip = await JSZip.loadAsync(arrayBuffer);

  // ppt/slides/slide*.xml 파일을 슬라이드 번호 순으로 정렬
  const slideEntries = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/(\d+)\.xml$/)?.[1] ?? '0', 10);
      const numB = parseInt(b.match(/(\d+)\.xml$/)?.[1] ?? '0', 10);
      return numA - numB;
    });

  const slideTexts: string[] = [];

  for (const entryName of slideEntries) {
    const xmlString = await zip.files[entryName].async('string');
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');

    // <a:t> 요소에서 텍스트 추출 (DOMParser는 로컬명 'a:t' 대신 't'로 매칭 가능)
    const textNodes = doc.getElementsByTagNameNS(
      'http://schemas.openxmlformats.org/drawingml/2006/main',
      't'
    );
    const slideText = Array.from(textNodes)
      .map((node) => node.textContent ?? '')
      .join(' ')
      .trim();

    if (slideText) {
      const slideNum = entryName.match(/(\d+)\.xml$/)?.[1] ?? '';
      slideTexts.push(`[Slide ${slideNum}]\n${slideText}`);
    }
  }

  return {
    text: slideTexts.join('\n\n').trim(),
    confidence: 95,
    blocks: [],
  };
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Office 파일(Word/Excel/PowerPoint)을 오픈소스 라이브러리로 텍스트 추출.
 * 구형 바이너리 포맷(.doc, .ppt)은 지원하지 않으며 의미 있는 오류를 반환함.
 */
export async function processOfficeFileWithOcr(file: File): Promise<OcrResult> {
  const ext = getFileExtension(file.name);

  // 구형 OLE 바이너리 포맷은 브라우저에서 변환 불가
  if (ext === '.doc') {
    throw new OcrError(
      'UNSUPPORTED_FORMAT',
      '구형 .doc 형식은 지원하지 않습니다. .docx로 변환 후 다시 시도해 주세요.'
    );
  }
  if (ext === '.ppt') {
    throw new OcrError(
      'UNSUPPORTED_FORMAT',
      '구형 .ppt 형식은 지원하지 않습니다. .pptx로 변환 후 다시 시도해 주세요.'
    );
  }

  const arrayBuffer = await file.arrayBuffer();

  switch (ext) {
    case '.docx':
      return processDocx(arrayBuffer);

    case '.xlsx':
    case '.xls':
      return processExcel(arrayBuffer);

    case '.pptx':
      return processPptx(arrayBuffer);

    default:
      throw new OcrError('UNSUPPORTED_FORMAT', `지원하지 않는 Office 형식입니다: ${file.name}`);
  }
}
