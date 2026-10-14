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
  /** Si se eligió "Usar este grupo", las sugerencias salen solo de sus recetas. */
  private readonly _grupo = signal<{ nombre: string; recetaIds: ReadonlySet<string> } | null>(null);
  readonly grupo = this._grupo.asReadonly();

  readonly seleccionados = this._seleccionados.asReadonly();
  readonly elecciones = this._elecciones.asReadonly();

  readonly totalSeleccionados = computed(() => this._seleccionados().size);

  /** Rankings por franja, recalculados solos cuando cambia la selección. Básicos = siempre disponibles. */
  readonly sugerencias = computed(() =>
    sugerirPorFranja(
      this.recetas.todas().filter((r) => !this._grupo() || this._grupo()!.recetaIds.has(r.id)),
      this._seleccionados(),
      this.ingredientes.basicos(),
    ),
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

  usarGrupo(nombre: string, recetaIds: readonly string[]): void {
    this._grupo.set({ nombre, recetaIds: new Set(recetaIds) });
    this._elecciones.set(new Map());
  }

  quitarGrupo(): void {
    this._grupo.set(null);
  }

  reiniciar(): void {
    this._seleccionados.set(new Set());
    this._elecciones.set(new Map());
    this._grupo.set(null);
  }
}
