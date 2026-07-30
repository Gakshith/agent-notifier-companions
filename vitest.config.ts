import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
    // ponytail: no test files exist yet (Task 2 adds the first one). Vitest's
    // default exits 1 on an empty suite; the brief expects exit 0 here.
    passWithNoTests: true,
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
