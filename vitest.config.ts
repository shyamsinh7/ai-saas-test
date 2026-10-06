import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['backend/**/*.test.ts', 'frontend/**/*.test.ts'],
    // Frontend tests opt into jsdom with a `@vitest-environment jsdom` docblock.
    environment: 'node',
  },
});
