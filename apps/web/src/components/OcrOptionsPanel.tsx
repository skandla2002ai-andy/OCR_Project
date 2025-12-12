import { OcrOptions } from '@core-nexus/ocr-core';

interface Props {
  options: OcrOptions;
  onChange: (options: OcrOptions) => void;
}

export function OcrOptionsPanel({ options, onChange }: Props) {
  const handleChange = (key: keyof OcrOptions, value: string | boolean) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="options-panel">
      <h3>설정</h3>
      <div className="option-group">
        <label htmlFor="language-select">언어</label>
        <select
          id="language-select"
          value={options.language || 'eng'}
          onChange={(e) => handleChange('language', e.target.value)}
        >
          <option value="eng">영어 (English)</option>
          <option value="kor">한국어 (Korean)</option>
          <option value="jpn">일본어 (Japanese)</option>
        </select>
      </div>

      <div className="option-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={!!options.detectOrientation}
            onChange={(e) => handleChange('detectOrientation', e.target.checked)}
          />
          방향 자동 감지
        </label>
      </div>

      <div className="option-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={!!options.enhanceContrast}
            onChange={(e) => handleChange('enhanceContrast', e.target.checked)}
          />
          대비 향상 (전처리)
        </label>
      </div>
    </div>
  );
}
