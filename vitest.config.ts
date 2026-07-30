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
  // ponytail: Vite eagerly loads the root postcss.config.mjs to build its CSS
  // pipeline even though no test touches CSS. That config uses the string-array
  // plugin shorthand (`plugins: ['@tailwindcss/postcss']`), which Next's own
  // loader resolves but Vite's postcss loader does not, throwing "Invalid
  // PostCSS Plugin". Short-circuit Vite's postcss discovery for the test run
  // only; the real postcss.config.mjs still drives `next build` untouched.
  css: {
    postcss: {
      plugins: [],
    },
  },
});
