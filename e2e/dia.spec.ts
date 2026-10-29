import { expect, test } from '@playwright/test';
import { InicioPage } from './paginas/inicio.page';
import { OpcionesPage } from './paginas/opciones.page';
import { SeleccionarPage } from './paginas/seleccionar.page';

test.describe('Armar mi día (flujo crítico)', () => {
  test('DIA-001 · de los ingredientes al menú del día', async ({ page }) => {
    const inicio = new InicioPage(page);
    const seleccionar = new SeleccionarPage(page);
    const opciones = new OpcionesPage(page);

    await inicio.abrir();
    await inicio.elegirIngredientes.click();
    await expect(page).toHaveURL(/\/dia$/);

    await seleccionar.marcar('papa', 'ing_papa');
    await seleccionar.marcar('cebolla', 'ing_cebolla');
    await expect(seleccionar.buscarRecetas).toContainText('(2)');
    await seleccionar.buscarRecetas.click();

    await expect(page).toHaveURL(/\/dia\/opciones$/);
    await opciones.elegirPrimera('seco');
    await expect(opciones.armarDia).toBeEnabled();
    await opciones.armarDia.click();

    await expect(page).toHaveURL(/\/dia\/resumen$/);
    await expect(page.getByTestId('dia-armado')).toBeVisible();
    await expect(page.getByTestId('comida-seco')).toBeVisible();
  });

  test('DIA-002 · «Usar mi despensa» marca lo que hay en casa', async ({ page }) => {
    const seleccionar = new SeleccionarPage(page);
    await page.goto('/dia');
    await seleccionar.usarDespensa.click();
    await expect(seleccionar.buscarRecetas).not.toContainText('(0)');
    await expect(seleccionar.buscarRecetas).not.toHaveClass(/deshabilitado/);
  });

  test('DIA-003 · sin ingredientes no se puede buscar', async ({ page }) => {
    const seleccionar = new SeleccionarPage(page);
    await page.goto('/dia');
    await expect(seleccionar.buscarRecetas).toContainText('(0)');
    await expect(seleccionar.buscarRecetas).toHaveClass(/deshabilitado/);
  });
});
