import { computed, Injectable, signal } from '@angular/core';
import {
  coincideIngrediente,
  Ingrediente,
} from '../../domain/ingredientes/ingrediente.model';

@Injectable({ providedIn: 'root' })
export class IngredientesStore {
  private readonly _porId = signal<Map<string, Ingrediente>>(new Map());

  readonly porId = this._porId.asReadonly();

  readonly todos = computed(() =>
    [...this._porId().values()]
      .filter((i) => i.activo)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  );

  readonly total = computed(() => this.todos().length);

  cargar(ingredientes: Ingrediente[]): void {
    this._porId.set(new Map(ingredientes.map((i) => [i.id, i])));
  }

  obtener(id: string): Ingrediente | undefined {
    return this._porId().get(id);
  }

  /** Búsqueda en memoria por nombre o sinónimos (sin tocar Firestore). */
  buscar(consulta: string): Ingrediente[] {
    return this.todos().filter((i) => coincideIngrediente(i, consulta));
  }
}
