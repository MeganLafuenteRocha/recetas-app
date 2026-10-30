import { expect, test } from '@playwright/test';

test.describe('Recetas', () => {
  test('REC-001 · buscar una receta y abrir su ficha', async ({ page }) => {
    await page.goto('/recetas');
    await page.getByTestId('buscar-receta').fill('silpancho');
    await page.getByTestId('receta-rec_silpancho').click();
    await expect(page).toHaveURL(/\/recetas\/rec_silpancho$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Silpancho' })).toBeVisible();
  });

  test('REC-002 · el modo cocina avanza paso a paso', async ({ page }) => {
    await page.goto('/recetas/rec_silpancho/cocinar');
    await page.getByRole('button', { name: /Empezar/ }).click();
    await expect(page.getByText(/^Paso 1 de \d+$/)).toBeVisible();
  });

  test('REC-003 · una ruta que no existe vuelve al inicio', async ({ page }) => {
    await page.goto('/no-existe');
    await expect(page).toHaveURL(/\/inicio$/);
  });
});
