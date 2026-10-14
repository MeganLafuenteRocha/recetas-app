import { computed, inject, Injectable, signal } from '@angular/core';
import { RecetasStore } from '../stores/recetas.store';
import { GuardarRecetaUseCase } from './guardar-receta.usecase';

/**
 * Botón de admin: recorre las recetas sin nutrición y le pregunta a la IA una vez por receta.
 * Pensado para las 20 recetas del seed (≈ 20 llamadas, una sola vez en la vida).
 */
@Injectable({ providedIn: 'root' })
export class CalcularNutricionFaltanteUseCase {
  private readonly recetas = inject(RecetasStore);
  private readonly guardar = inject(GuardarRecetaUseCase);

  private readonly _progreso = signal<{ hechas: number; total: number; fallidas: number } | null>(null);
  readonly progreso = this._progreso.asReadonly();

  readonly faltantes = computed(() => this.recetas.todas().filter((r) => !r.nutricionPorcion));

  async ejecutar(): Promise<void> {
    const pendientes = this.faltantes();
    let fallidas = 0;
    this._progreso.set({ hechas: 0, total: pendientes.length, fallidas });
    for (const [i, receta] of pendientes.entries()) {
      const r = await this.guardar.ejecutar(receta, true);
      if (r.nutricionPendiente || r.errores.length) fallidas++;
      this._progreso.set({ hechas: i + 1, total: pendientes.length, fallidas });
    }
  }
}
