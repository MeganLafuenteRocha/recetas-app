import { inject, Injectable } from '@angular/core';
import {
  conNombre,
  crearIngredientesDesdeTexto,
  Ingrediente,
} from '../../domain/ingredientes/ingrediente.model';
import { IngredienteRepository } from '../../domain/ingredientes/ingrediente.port';
import { IngredientesStore } from '../stores/ingredientes.store';

export type CambioLote = Partial<Pick<Ingrediente, 'esBasico' | 'categoria' | 'activo'>>;

/** Alta rápida, edición y cambios en lote. Nunca elimina: archiva (activo:false). */
@Injectable({ providedIn: 'root' })
export class AdministrarIngredientesUseCase {
  private readonly repo = inject(IngredienteRepository);
  private readonly store = inject(IngredientesStore);

  /** "papa, cebolla, haba" → crea los que no existan. Devuelve cuántos se crearon. */
  async altaRapida(texto: string, categoria: string): Promise<number> {
    const nuevos = crearIngredientesDesdeTexto(texto, categoria, [...this.store.porId().values()]);
    if (nuevos.length === 0) return 0;
    await this.guardar(nuevos);
    return nuevos.length;
  }

  async editar(ingrediente: Ingrediente, nombre: string, sinonimos: string[]): Promise<void> {
    const editado = {
      ...conNombre(ingrediente, nombre),
      sinonimos: sinonimos.map((s) => s.trim()).filter(Boolean),
    };
    await this.guardar([editado]);
  }

  /** Un solo writeBatch para todos los seleccionados. */
  async aplicarEnLote(ids: readonly string[], cambio: CambioLote): Promise<void> {
    const cambiados = ids
      .map((id) => this.store.obtener(id))
      .filter((i): i is Ingrediente => !!i)
      .map((i) => ({ ...i, ...cambio }));
    await this.guardar(cambiados);
  }

  private async guardar(ingredientes: Ingrediente[]): Promise<void> {
    await this.repo.guardarLote(ingredientes);
    this.store.actualizarVarios(ingredientes);
  }
}
