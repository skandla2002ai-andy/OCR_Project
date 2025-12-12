export type OcrErrorCode = 'INVALID_INPUT' | 'TIMEOUT' | 'UNSUPPORTED_FORMAT' | 'NOT_IMPLEMENTED';

export class OcrError extends Error {
  public readonly code: OcrErrorCode;

  constructor(code: OcrErrorCode, message: string) {
    super(message);
    this.name = 'OcrError';
    this.code = code;
  }
}
