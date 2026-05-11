import { useState, useEffect } from 'react';
import type { AppSettings, AIModel } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { getSettings, saveSettings } from '@/services/db';

const MODELS: { value: AIModel; label: string }[] = [
  { value: 'claude-opus-4-7', label: 'Claude Opus 4.7 (최고 성능)' },
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (균형)' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (빠름)' },
];

interface Props {
  onClose: () => void;
  onSaved: (settings: AppSettings) => void;
}

export function SettingsPanel({ onClose, onSaved }: Props) {
  const [form, setForm] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void getSettings().then(setForm);
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    await saveSettings(form);
    setSaved(true);
    onSaved(form);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>설정</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-body">
          <label className="settings-label">
            API 모드
            <select
              value={form.apiEndpointMode}
              onChange={(e) =>
                update('apiEndpointMode', e.target.value as AppSettings['apiEndpointMode'])
              }
            >
              <option value="proxy">서버 프록시 (/api/ai)</option>
              <option value="anthropic">Anthropic 직접 (브라우저에 API 키 노출)</option>
            </select>
          </label>

          {form.apiEndpointMode === 'anthropic' && (
            <label className="settings-label">
              Anthropic API 키
              <input
                type="password"
                value={form.apiKey}
                onChange={(e) => update('apiKey', e.target.value)}
                placeholder="sk-ant-..."
              />
              <span className="settings-warn">
                ⚠️ 브라우저에 API 키가 노출됩니다. 개발/테스트 전용으로만 사용하세요.
              </span>
            </label>
          )}

          {form.apiEndpointMode === 'proxy' && (
            <label className="settings-label">
              프록시 엔드포인트
              <input
                type="text"
                value={form.proxyEndpoint}
                onChange={(e) => update('proxyEndpoint', e.target.value)}
                placeholder="/api/ai"
              />
            </label>
          )}

          <label className="settings-label">
            모델
            <select value={form.model} onChange={(e) => update('model', e.target.value as AIModel)}>
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label className="settings-label">
            최대 토큰
            <input
              type="number"
              min={256}
              max={32000}
              value={form.maxTokens}
              onChange={(e) => update('maxTokens', Number(e.target.value))}
            />
          </label>

          <label className="settings-label">
            시스템 프롬프트
            <textarea
              rows={4}
              value={form.systemPrompt}
              onChange={(e) => update('systemPrompt', e.target.value)}
              placeholder="AI의 역할이나 행동 지침을 입력하세요…"
            />
          </label>
        </div>

        <div className="settings-footer">
          {saved && <span className="settings-saved">✓ 저장됨</span>}
          <button type="button" className="send-btn" onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
