import { Locator, Page } from '@playwright/test';

/** «¿Qué tienes hoy?»: buscar y marcar ingredientes, o usar la despensa. */
export class SeleccionarPage {
  readonly buscador: Locator;
  readonly usarDespensa: Locator;
  readonly buscarRecetas: Locator;

  constructor(private readonly page: Page) {
    this.buscador = page.getByTestId('buscar-ingrediente');
    this.usarDespensa = page.getByTestId('btn-usar-despensa');
    this.buscarRecetas = page.getByTestId('btn-buscar-recetas');
  }

  ingrediente(id: string): Locator {
    return this.page.getByTestId(`ingrediente-${id}`);
  }

  async marcar(nombre: string, id: string): Promise<void> {
    await this.buscador.fill(nombre);
    await this.ingrediente(id).click();
  }
}
