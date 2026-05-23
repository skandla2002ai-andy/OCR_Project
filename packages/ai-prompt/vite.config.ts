import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages 등 서브 경로 배포 시 VITE_BASE_SUBPATH 환경변수로 지정
// 예) VITE_BASE_SUBPATH=OCR_Project pnpm build  →  base = '/OCR_Project/'
// 로컬 dev/preview 에서는 설정 불필요  →  base = '/'
const subpath = process.env.VITE_BASE_SUBPATH;
const base = subpath ? `/${subpath}/` : '/';

export default defineConfig({
  base,

  resolve: {
    alias: { '@': '/src' },
  },

  plugins: [
    react(),
    VitePWA({
      // ── Service Worker 등록 방식 ───────────────────────────────
      registerType: 'prompt',
      injectRegister: 'auto',

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
        // 서브 경로 배포 시 scope/start_url 이 base 와 일치해야 PWA 설치 가능
        scope: base,
        start_url: `${base}?source=pwa`,
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,webp}'],
        cleanupOutdatedCaches: true,
        sourcemap: false,
        // SPA: 모든 탐색 요청을 캐시된 index.html 로 폴백
        navigateFallback: `${base}index.html`,
        // API 호출은 SW 인터셉트에서 제외
        navigateFallbackDenylist: [/^\/api\//, /^\/OCR_Project\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          {
            urlPattern: /pdf\.worker/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdfjs-worker-cache',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },

      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],

  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
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
