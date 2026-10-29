import { defineConfig } from 'vitest/config';

// Pruebas de firestore.rules contra el emulador (npm run test:reglas). No usan Angular.
export default defineConfig({
  test: {
    include: ['pruebas-reglas/**/*.spec.ts'],
    environment: 'node',
    fileParallelism: false,
  },
});
