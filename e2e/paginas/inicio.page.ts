import { expect, Locator, Page } from '@playwright/test';

/** Pantalla de inicio: saludo, «Elegir mis ingredientes» y la tarjeta de hoy. */
export class InicioPage {
  readonly elegirIngredientes: Locator;
  readonly tarjetaHoy: Locator;

  constructor(private readonly page: Page) {
    this.elegirIngredientes = page.getByTestId('btn-elegir-ingredientes');
    this.tarjetaHoy = page.getByTestId('card-hoy');
  }

  async abrir(): Promise<void> {
    await this.page.goto('/inicio');
    await expect(this.elegirIngredientes).toBeVisible();
  }
}
