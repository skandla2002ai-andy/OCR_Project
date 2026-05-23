import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: {
    alias: { '@': '/src' },
  },

  plugins: [
    react(),
    VitePWA({
      // ── Service Worker 등록 방식 ───────────────────────────────
      registerType: 'prompt', // 업데이트 시 사용자에게 확인 (autoUpdate 대신 UX 안전)
      injectRegister: 'auto', // index.html 에 SW 등록 스크립트 자동 주입

      // ── 정적 자산 사전 캐시 목록 ─────────────────────────────
      includeAssets: [
        'favicon.ico',
        'icon.svg',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png',
        'apple-touch-icon.png',
        'robots.txt',
      ],

      // ── Web App Manifest ──────────────────────────────────────
      manifest: {
        name: 'AI Prompt',
        short_name: 'AI Prompt',
        description: 'AI Prompt — 이미지·PDF 첨부, 멀티 프로바이더 지원 AI 채팅 PWA',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/?source=pwa',
        // purpose 는 반드시 항목별로 분리
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        categories: ['productivity', 'utilities'],
      },

      // ── Workbox (Service Worker 캐싱 전략) ────────────────────
      workbox: {
        // 빌드된 JS/CSS/HTML/폰트/이미지 사전 캐시
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,webp}'],
        // 구버전 캐시 자동 정리
        cleanupOutdatedCaches: true,
        // sourceMap 비활성(프로덕션)
        sourcemap: false,
        runtimeCaching: [
          {
            // API 호출: 네트워크 우선, 10초 타임아웃 후 캐시 폴백
            urlPattern: /^\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1일
              },
            },
          },
          {
            // pdfjs worker — CacheFirst (거의 변하지 않음)
            urlPattern: /pdf\.worker/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdfjs-worker-cache',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },

      // ── 개발 서버에서도 SW 동작 확인 가능하게 ────────────────
      devOptions: {
        enabled: false, // true 로 바꾸면 dev 모드에서도 SW 활성화
        type: 'module',
      },
    }),
  ],

  build: {
    // 번들 크기 경고 기준 (pdfjs-dist 가 크므로 올림)
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // 주요 모듈을 별도 청크로 분리 → 초기 로드 최소화
        manualChunks: {
          react: ['react', 'react-dom'],
          anthropic: ['@anthropic-ai/sdk'],
          dexie: ['dexie', 'dexie-react-hooks'],
          pdfjs: ['pdfjs-dist'],
        },
      },
    },
  },

  server: {
    port: 5174,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
