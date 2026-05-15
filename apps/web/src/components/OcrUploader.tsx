import { useState } from 'react';
import { processFileWithOcr, OcrResult } from '@core-nexus/ocr-core';
import { useOcrOptions } from '../hooks/useOcrOptions';
import { OcrOptionsPanel } from './OcrOptionsPanel';

export function OcrUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { options, updateOptions } = useOcrOptions({
    language: 'eng',
    detectOrientation: false,
    enhanceContrast: false,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleRecognize = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const ocrResult = await processFileWithOcr(file, options);
      setResult(ocrResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ocr-uploader">
      <div className="control-panel">
        <OcrOptionsPanel options={options} onChange={updateOptions} />
      </div>

      <div className="upload-section">
        <label htmlFor="file-upload" className="file-label">
          파일 선택
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            accept="image/*,.pdf"
            style={{ display: 'none' }}
          />
        </label>
        <span className="file-instruction">
          {file ? file.name : '이미지 또는 PDF 파일을 선택하세요'}
        </span>
      </div>

      {file && (
        <div className="action-section">
          <button
            onClick={() => void handleRecognize()}
            disabled={loading}
            className="recognize-btn"
          >
            {loading ? '처리 중...' : '인식하기'}
          </button>
        </div>
      )}

      {error && <div className="error-message">Error: {error}</div>}

      {result && (
        <div className="result-section">
          <h3>인식 결과 (신뢰도: {Math.round(result.confidence)}%)</h3>
          <pre className="ocr-text">{result.text}</pre>
        </div>
      )}
    </div>
  );
}
