import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ── PWA Service Worker 등록 ────────────────────────────────────
// vite-plugin-pwa 의 registerType: 'prompt' 에 맞춰
// 새 버전이 준비되면 사용자에게 배너로 알림
if ('serviceWorker' in navigator) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      // SW가 새 버전으로 교체 준비 완료 시 호출
      onNeedRefresh() {
        const ok = window.confirm(
          '새 버전이 있습니다. 지금 업데이트할까요?\n(확인 시 페이지가 새로고침됩니다)'
        );
        if (ok) window.location.reload();
      },
      // 오프라인 지원 준비 완료 시 호출
      onOfflineReady() {
        console.info('[PWA] 오프라인 사용 가능 상태입니다.');
      },
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
