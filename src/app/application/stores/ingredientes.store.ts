import { computed, Injectable, signal } from '@angular/core';
import {
  coincideIngrediente,
  Ingrediente,
} from '../../domain/ingredientes/ingrediente.model';

const porNombre = (a: Ingrediente, b: Ingrediente) => a.nombre.localeCompare(b.nombre, 'es');

@Injectable({ providedIn: 'root' })
export class IngredientesStore {
  private readonly _porId = signal<Map<string, Ingrediente>>(new Map());

  readonly porId = this._porId.asReadonly();

  /** Solo activos: lo que se ve en el selector del día, la despensa y el editor. */
  readonly todos = computed(() =>
    [...this._porId().values()].filter((i) => i.activo).sort(porNombre),
  );

  readonly archivados = computed(() =>
    [...this._porId().values()].filter((i) => !i.activo).sort(porNombre),
  );

  readonly total = computed(() => this.todos().length);

  /** Básicos del hogar (sal, azúcar…): la afinidad los da siempre por disponibles. */
  readonly basicos = computed(
    () => new Set(this.todos().filter((i) => i.esBasico).map((i) => i.id)),
  );

  cargar(ingredientes: Ingrediente[]): void {
    this._porId.set(new Map(ingredientes.map((i) => [i.id, i])));
  }

  /** Refleja en memoria lo que ya se guardó en Firestore (alta o edición en lote). */
  actualizarVarios(ingredientes: readonly Ingrediente[]): void {
    const mapa = new Map(this._porId());
    for (const i of ingredientes) mapa.set(i.id, i);
    this._porId.set(mapa);
  }

  obtener(id: string): Ingrediente | undefined {
    return this._porId().get(id);
  }

  nombre(id: string): string {
    return this._porId().get(id)?.nombre ?? id;
  }

  /** Búsqueda en memoria por nombre o sinónimos (sin tocar Firestore). */
  buscar(consulta: string): Ingrediente[] {
    return this.todos().filter((i) => coincideIngrediente(i, consulta));
  }
}
