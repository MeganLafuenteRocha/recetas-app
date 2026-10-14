import { computed, inject, Injectable, signal } from '@angular/core';
import { DespensaRepository } from '../../domain/despensa/despensa.port';

const DEBOUNCE_MS = 800;

/** Lo que hay en casa. Cada toque es instantáneo; el write a Firestore va agrupado (debounce). */
@Injectable({ providedIn: 'root' })
export class DespensaStore {
  private readonly repo = inject(DespensaRepository);

  private readonly _ids = signal<Set<string>>(new Set());
  private timerGuardado: ReturnType<typeof setTimeout> | null = null;

  readonly ids = this._ids.asReadonly();
  readonly total = computed(() => this._ids().size);

  tiene(id: string): boolean {
    return this._ids().has(id);
  }

  cargar(ingredienteIds: string[]): void {
    this._ids.set(new Set(ingredienteIds));
  }

  /** Marca o desmarca un ingrediente. */
  alternar(id: string): void {
    this.marcar(id, !this._ids().has(id));
  }

  marcar(id: string, tiene: boolean): void {
    const nuevo = new Set(this._ids());
    if (tiene) nuevo.add(id);
    else nuevo.delete(id);
    this._ids.set(nuevo);
    this.programarGuardado();
  }

  /** Lo comprado de una lista pasa a la despensa de una vez. */
  agregarVarios(ids: readonly string[]): void {
    if (ids.length === 0) return;
    this._ids.set(new Set([...this._ids(), ...ids]));
    this.programarGuardado();
  }

  private programarGuardado(): void {
    if (this.timerGuardado) clearTimeout(this.timerGuardado);
    this.timerGuardado = setTimeout(() => {
      this.timerGuardado = null;
      void this.repo.guardar([...this._ids()]);
    }, DEBOUNCE_MS);
  }
}
