import type { OcrInput, OcrOptions, OcrResult } from './types';
import { OcrError } from './errors';
import { StubEngine } from './engine';

const stubEngine = new StubEngine();

function isArrayBuffer(input: unknown): input is ArrayBuffer {
  return typeof ArrayBuffer !== 'undefined' && input instanceof ArrayBuffer;
}

function isBlob(input: unknown): input is Blob {
  return typeof Blob !== 'undefined' && input instanceof Blob;
}

function isFile(input: unknown): input is File {
  return typeof File !== 'undefined' && input instanceof File;
}

function validateInput(input: unknown): asserts input is OcrInput {
  if (typeof input === 'string') return;
  if (isArrayBuffer(input)) return;
  if (isBlob(input)) return;
  if (isFile(input)) return;
  throw new OcrError('INVALID_INPUT', 'Unsupported input type');
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs?: number): Promise<T> {
  if (timeoutMs === undefined || timeoutMs <= 0) {
    return promise;
  }

  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new OcrError('TIMEOUT', `OCR timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timeoutHandle!);
  }
}

async function stubWork(): Promise<OcrResult> {
  // Minimal delay to allow timeout tests to race.
  await new Promise((resolve) => setTimeout(resolve, 15));
  return {
    text: '',
    confidence: 0,
    blocks: [],
  };
}

/**
 * Stub recognize implementation with validation and timeout support.
 */
export async function recognize(input: unknown, options: OcrOptions = {}): Promise<OcrResult> {
  validateInput(input);
  const work = stubEngine.recognize(input, options ?? {});
  return withTimeout(work ?? stubWork(), options.timeoutMs);
}

export * from './types';
export * from './errors';
export * from './engine';
export * from './config/ocrConfig';
