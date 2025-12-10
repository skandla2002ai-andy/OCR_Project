export type OcrErrorCode = 'INVALID_INPUT' | 'TIMEOUT';

export class OcrError extends Error {
  public readonly code: OcrErrorCode;

  constructor(code: OcrErrorCode, message: string) {
    super(message);
    this.name = 'OcrError';
    this.code = code;
  }
}
