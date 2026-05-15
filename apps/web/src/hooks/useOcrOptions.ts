import { useState, useCallback } from 'react';
import { OcrOptions } from '@core-nexus/ocr-core';

export function useOcrOptions(initialOptions?: OcrOptions) {
  const [options, setOptions] = useState<OcrOptions>(
    initialOptions || {
      language: 'eng',
      detectOrientation: false,
      enhanceContrast: false,
    }
  );

  const updateOptions = useCallback((newOptions: OcrOptions) => {
    setOptions(newOptions);
  }, []);

  return { options, updateOptions };
}
