import { computed, inject, Injectable, signal } from '@angular/core';
import { DespensaRepository } from '../../domain/despensa/despensa.port';

const DEBOUNCE_MS = 800;

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

  /** Marca o desmarca un ingrediente. El write a Firestore va con debounce. */
  alternar(id: string): void {
    const nuevo = new Set(this._ids());
    if (nuevo.has(id)) {
      nuevo.delete(id);
    } else {
      nuevo.add(id);
    }
    this._ids.set(nuevo);
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
