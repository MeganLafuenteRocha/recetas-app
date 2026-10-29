import { Locator, Page } from '@playwright/test';

/** Opciones para el día: una tarjeta por receta sugerida, agrupadas por franja. */
export class OpcionesPage {
  readonly armarDia: Locator;

  constructor(private readonly page: Page) {
    this.armarDia = page.getByTestId('btn-armar-dia');
  }

  franja(codigo: string): Locator {
    return this.page.getByTestId(`franja-${codigo}`);
  }

  /** Elige la primera sugerencia (la de mayor afinidad) de una franja. */
  async elegirPrimera(codigo: string): Promise<void> {
    await this.franja(codigo).locator('[data-testid^="opcion-"]').first().click();
  }
}
