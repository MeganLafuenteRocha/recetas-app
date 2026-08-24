import { computed, Injectable, signal } from '@angular/core';
import { normalizarTexto } from '../../domain/ingredientes/ingrediente.model';
import { idsDeIngredientes, Receta } from '../../domain/recetas/receta.model';

@Injectable({ providedIn: 'root' })
export class RecetasStore {
  private readonly _porId = signal<Map<string, Receta>>(new Map());

  readonly porId = this._porId.asReadonly();

  readonly todas = computed(() =>
    [...this._porId().values()]
      .filter((r) => r.activo)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  );

  readonly total = computed(() => this.todas().length);

  readonly porFranja = computed(() => {
    const grupos = new Map<string, Receta[]>();
    for (const receta of this.todas()) {
      const lista = grupos.get(receta.tipoComida) ?? [];
      lista.push(receta);
      grupos.set(receta.tipoComida, lista);
    }
    return grupos;
  });

  cargar(recetas: Receta[]): void {
    this._porId.set(new Map(recetas.map((r) => [r.id, r])));
  }

  actualizar(receta: Receta): void {
    const mapa = new Map(this._porId());
    mapa.set(receta.id, receta);
    this._porId.set(mapa);
  }

  obtener(id: string): Receta | undefined {
    return this._porId().get(id);
  }

  /** Búsqueda en memoria por nombre de receta o por ingrediente que use. */
  buscar(consulta: string, idsIngredientesCoincidentes: Set<string>): Receta[] {
    const q = normalizarTexto(consulta);
    if (q.length === 0) return [];
    return this.todas().filter((receta) => {
      if (normalizarTexto(receta.nombre).includes(q)) return true;
      const ids = idsDeIngredientes(receta);
      for (const id of idsIngredientesCoincidentes) {
        if (ids.has(id)) return true;
      }
      return false;
    });
  }
}
