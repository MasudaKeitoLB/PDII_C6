import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// デモURL（claude.ai の Artifact）用の1ファイルビルド。
// React は CDN（cdnjs）の UMD 版を読み込み、アプリのコードと画像は HTML に埋め込む。
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: [
      { find: /^react\/jsx-runtime$/, replacement: local('./src/demo/jsx-runtime-global.ts') },
      { find: /^react-dom\/client$/, replacement: local('./src/demo/react-dom-client-global.ts') },
    ],
  },
  build: {
    outDir: 'dist-demo',
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        format: 'iife',
        globals: { react: 'React', 'react-dom': 'ReactDOM' },
      },
    },
  },
});
