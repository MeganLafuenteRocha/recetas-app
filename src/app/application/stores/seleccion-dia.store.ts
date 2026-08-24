import { computed, inject, Injectable, signal } from '@angular/core';
import { sugerirPorFranja } from '../../domain/planificacion/afinidad.service';
import { DespensaStore } from './despensa.store';
import { IngredientesStore } from './ingredientes.store';
import { RecetasStore } from './recetas.store';

/**
 * Estado efímero del flujo "¿Qué tienes hoy?" (05A → 05B → 05C).
 * Todo se calcula en memoria: cero lecturas a Firestore.
 */
@Injectable({ providedIn: 'root' })
export class SeleccionDiaStore {
  private readonly ingredientes = inject(IngredientesStore);
  private readonly recetas = inject(RecetasStore);
  private readonly despensa = inject(DespensaStore);

  private readonly _seleccionados = signal<Set<string>>(new Set());
  private readonly _elecciones = signal<Map<string, string>>(new Map());

  readonly seleccionados = this._seleccionados.asReadonly();
  readonly elecciones = this._elecciones.asReadonly();

  readonly totalSeleccionados = computed(() => this._seleccionados().size);

  /** Básicos (sal, azúcar…): siempre se consideran disponibles. */
  private readonly basicos = computed(
    () => new Set(this.ingredientes.todos().filter((i) => i.esBasico).map((i) => i.id)),
  );

  /** Rankings por franja, recalculados solos cuando cambia la selección. */
  readonly sugerencias = computed(() =>
    sugerirPorFranja(this.recetas.todas(), this._seleccionados(), this.basicos()),
  );

  readonly totalElegidas = computed(() => this._elecciones().size);

  tieneSeleccionado(id: string): boolean {
    return this._seleccionados().has(id);
  }

  alternar(id: string): void {
    const nuevo = new Set(this._seleccionados());
    if (nuevo.has(id)) {
      nuevo.delete(id);
    } else {
      nuevo.add(id);
    }
    this._seleccionados.set(nuevo);
  }

  /** Copia la despensa guardada como selección de hoy. */
  usarDespensa(): void {
    this._seleccionados.set(new Set(this.despensa.ids()));
  }

  eleccionDe(franja: string): string | undefined {
    return this._elecciones().get(franja);
  }

  /** Elegir una receta para una franja (o des-elegirla si ya estaba). */
  elegir(franja: string, recetaId: string): void {
    const nuevo = new Map(this._elecciones());
    if (nuevo.get(franja) === recetaId) {
      nuevo.delete(franja);
    } else {
      nuevo.set(franja, recetaId);
    }
    this._elecciones.set(nuevo);
  }

  reiniciar(): void {
    this._seleccionados.set(new Set());
    this._elecciones.set(new Map());
  }
}
