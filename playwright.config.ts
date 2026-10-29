import { defineConfig, devices } from '@playwright/test';

/**
 * E2E contra el MODO DEMO (datos en memoria): nunca toca la base real ni pide login de Google.
 * Local: npm run e2e (levanta `npm run demo` solo). CI: mismo comando en GitHub Actions.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4300',
    testIdAttribute: 'data-testid',
    trace: 'on-first-retry',
  },
  // La app se usa en el celular: se prueba con viewport de teléfono.
  projects: [{ name: 'celular', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'npx ng serve --configuration demo --port 4300',
    url: 'http://localhost:4300',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
