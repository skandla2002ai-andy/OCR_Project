import { useState, useEffect } from 'react';
import type { AppSettings, AIModel, ApiProvider } from '@/types';
import { DEFAULT_SETTINGS, PROVIDER_LABELS } from '@/types';
import { getSettings, saveSettings } from '@/services/db';

const CLAUDE_MODELS: { value: AIModel; label: string }[] = [
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
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    void getSettings().then(setForm);
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setTestResult(null);
  };

  const handleSave = async () => {
    await saveSettings(form);
    setSaved(true);
    onSaved(form);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(form);
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>AI 연결 설정</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-body">
          {/* Provider 선택 */}
          <label className="settings-label">
            연결 방식
            <select
              value={form.provider}
              onChange={(e) => update('provider', e.target.value as ApiProvider)}
            >
              {(Object.entries(PROVIDER_LABELS) as [ApiProvider, string][]).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="settings-divider" />

          {/* Provider별 설정 */}
          {form.provider === 'anthropic' && <AnthropicFields form={form} update={update} />}
          {form.provider === 'proxy' && <ProxyFields form={form} update={update} />}
          {form.provider === 'ollama' && <OllamaFields form={form} update={update} />}
          {form.provider === 'openai' && <OpenAIFields form={form} update={update} />}

          <div className="settings-divider" />

          {/* 공통 설정 */}
          <CommonFields form={form} update={update} />
        </div>

        <div className="settings-footer">
          <button type="button" className="test-btn" onClick={handleTest} disabled={testing}>
            {testing ? '테스트 중…' : '연결 테스트'}
          </button>
          {testResult && (
            <span className={`test-result ${testResult.ok ? 'ok' : 'fail'}`}>
              {testResult.ok ? '✓' : '✗'} {testResult.msg}
            </span>
          )}
          <span style={{ flex: 1 }} />
          {saved && <span className="settings-saved">✓ 저장됨</span>}
          <button type="button" className="send-btn" onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Provider별 필드 컴포넌트 ──────────────────────────────────

type Updater = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;

function AnthropicFields({ form, update }: { form: AppSettings; update: Updater }) {
  return (
    <>
      <div className="provider-info">
        Claude API를 브라우저에서 직접 호출합니다.
        <br />
        <span className="settings-warn">
          ⚠ API 키가 브라우저에 노출됩니다. 개발/테스트 전용으로만 사용하세요.
        </span>
      </div>
      <label className="settings-label">
        Anthropic API 키
        <input
          type="password"
          value={form.anthropicApiKey}
          onChange={(e) => update('anthropicApiKey', e.target.value)}
          placeholder="sk-ant-api03-..."
        />
      </label>
      <label className="settings-label">
        모델
        <select value={form.model} onChange={(e) => update('model', e.target.value as AIModel)}>
          {CLAUDE_MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

function ProxyFields({ form, update }: { form: AppSettings; update: Updater }) {
  return (
    <>
      <div className="provider-info">
        자체 백엔드 서버를 통해 AI를 호출합니다. API 키는 서버에서 관리합니다.
        <br />
        서버는 <code>POST {form.proxyEndpoint}</code>에서 SSE 스트림을 반환해야 합니다.
      </div>
      <label className="settings-label">
        프록시 엔드포인트 URL
        <input
          type="text"
          value={form.proxyEndpoint}
          onChange={(e) => update('proxyEndpoint', e.target.value)}
          placeholder="/api/ai 또는 https://my-server.com/api/ai"
        />
      </label>
      <label className="settings-label">
        모델 (서버에 전달)
        <select value={form.model} onChange={(e) => update('model', e.target.value as AIModel)}>
          {CLAUDE_MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

function OllamaFields({ form, update }: { form: AppSettings; update: Updater }) {
  return (
    <>
      <div className="provider-info">
        로컬에서 실행 중인 <strong>Ollama</strong> 서버에 연결합니다.
        <br />
        API 키 없이 무료로 사용 가능합니다. <code>ollama serve</code> 가 실행 중이어야 합니다.
      </div>
      <label className="settings-label">
        Ollama 서버 URL
        <input
          type="text"
          value={form.ollamaBaseUrl}
          onChange={(e) => update('ollamaBaseUrl', e.target.value)}
          placeholder="http://localhost:11434"
        />
      </label>
      <label className="settings-label">
        모델 이름
        <input
          type="text"
          value={form.ollamaModel}
          onChange={(e) => update('ollamaModel', e.target.value)}
          placeholder="llama3, mistral, gemma3, llava …"
        />
        <span className="settings-hint">
          이미지 지원: llava, llava-phi3, moondream 등 vision 모델 필요
        </span>
      </label>
    </>
  );
}

function OpenAIFields({ form, update }: { form: AppSettings; update: Updater }) {
  const isCustomBase = !form.openaiBaseUrl.includes('api.openai.com');
  return (
    <>
      <div className="provider-info">
        OpenAI API 또는 <strong>OpenAI 호환 API</strong>(LM Studio, vLLM, LocalAI 등)에 연결합니다.
      </div>
      <label className="settings-label">
        API Base URL
        <input
          type="text"
          value={form.openaiBaseUrl}
          onChange={(e) => update('openaiBaseUrl', e.target.value)}
          placeholder="https://api.openai.com/v1"
        />
        {isCustomBase && <span className="settings-hint">로컬 서버: API 키를 비워도 됩니다.</span>}
      </label>
      <label className="settings-label">
        API 키
        <input
          type="password"
          value={form.openaiApiKey}
          onChange={(e) => update('openaiApiKey', e.target.value)}
          placeholder="sk-... (로컬 서버는 생략 가능)"
        />
      </label>
      <label className="settings-label">
        모델 이름
        <input
          type="text"
          value={form.openaiModel}
          onChange={(e) => update('openaiModel', e.target.value)}
          placeholder="gpt-4o, gpt-4o-mini, local-model …"
        />
      </label>
    </>
  );
}

function CommonFields({ form, update }: { form: AppSettings; update: Updater }) {
  return (
    <>
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
        Temperature
        <div className="range-row">
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={form.temperature}
            onChange={(e) => update('temperature', Number(e.target.value))}
          />
          <span className="range-value">{form.temperature.toFixed(1)}</span>
        </div>
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
    </>
  );
}

// ── 연결 테스트 ───────────────────────────────────────────────

async function testConnection(settings: AppSettings): Promise<{ ok: boolean; msg: string }> {
  try {
    switch (settings.provider) {
      case 'anthropic': {
        if (!settings.anthropicApiKey) return { ok: false, msg: 'API 키를 입력하세요.' };
        const resp = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': settings.anthropicApiKey,
            'anthropic-version': '2023-06-01',
          },
        });
        return resp.ok
          ? { ok: true, msg: 'Anthropic API 연결 성공' }
          : { ok: false, msg: `인증 실패 (${resp.status})` };
      }
      case 'proxy': {
        const resp = await fetch(settings.proxyEndpoint, {
          method: 'HEAD',
        }).catch(() => null);
        return resp
          ? { ok: true, msg: `프록시 서버 응답 확인 (${resp.status})` }
          : { ok: false, msg: '프록시 서버에 연결할 수 없습니다.' };
      }
      case 'ollama': {
        const base = settings.ollamaBaseUrl.replace(/\/$/, '');
        const resp = await fetch(`${base}/api/tags`).catch(() => null);
        if (!resp?.ok) return { ok: false, msg: 'Ollama 서버에 연결할 수 없습니다.' };
        const data = (await resp.json()) as { models?: { name: string }[] };
        const count = data.models?.length ?? 0;
        return { ok: true, msg: `Ollama 연결 성공 · 모델 ${count}개 설치됨` };
      }
      case 'openai': {
        const base = settings.openaiBaseUrl.replace(/\/$/, '');
        const resp = await fetch(`${base}/models`, {
          headers: settings.openaiApiKey
            ? { Authorization: `Bearer ${settings.openaiApiKey}` }
            : {},
        }).catch(() => null);
        return resp?.ok
          ? { ok: true, msg: 'OpenAI 호환 서버 연결 성공' }
          : { ok: false, msg: `연결 실패 (${resp?.status ?? 'network error'})` };
      }
    }
  } catch (e) {
    return { ok: false, msg: String(e) };
  }
}
