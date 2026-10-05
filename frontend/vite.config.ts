import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: import.meta.dirname,
  // Relative asset paths so the site works under https://<user>.github.io/<repo>/.
  base: './',
  build: {
    outDir: path.resolve(import.meta.dirname, '../dist'),
    emptyOutDir: true,
  },
});
