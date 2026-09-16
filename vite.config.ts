import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const mockServiceWorker = readFileSync(new URL('./src/mocks/mockServiceWorker.js', import.meta.url));

export default defineConfig({
  publicDir: 'assets',
  plugins: [
    react(),
    {
      name: 'serve-msw-worker',
      configureServer(server) {
        server.middlewares.use('/mockServiceWorker.js', (_request, response) => {
          response.setHeader('Content-Type', 'application/javascript');
          response.end(mockServiceWorker);
        });
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'mockServiceWorker.js', source: mockServiceWorker });
      },
    },
  ],
});
