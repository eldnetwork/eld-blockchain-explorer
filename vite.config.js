import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const analyticsApiUrl = env.ANALYTICS_API_URL || 'http://127.0.0.1:9010';

  return {
    plugins: [
      react({
        include: '**/*.{jsx,js}',
      }),
    ],
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
    build: {
      outDir: 'build',
      sourcemap: true,
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    server: {
      port: 3000,
      // Optional same-origin proxies for local CORS (override with VITE_* URLs pointing at /rpc or /api).
      proxy: {
        '/rpc': {
          target: 'http://localhost:26657',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/rpc/, '') || '/',
        },
        '/api': {
          target: 'http://localhost:9001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '') || '/',
        },
        // Disk analytics API (separate from indexer /api). Used by /analytics page.
        '/analytics-api': {
          target: analyticsApiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/analytics-api/, '') || '/',
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/setupTests.js',
      include: ['src/**/*.{test,spec}.{js,jsx}'],
    },
  };
});
