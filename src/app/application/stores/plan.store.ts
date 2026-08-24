import { inject, Injectable, signal } from '@angular/core';
import { PlanDia } from '../../domain/planificacion/plan.model';
import { PlanRepository } from '../../domain/planificacion/plan.port';

@Injectable({ providedIn: 'root' })
export class PlanStore {
  private readonly repo = inject(PlanRepository);

  private readonly _hoy = signal<PlanDia | null>(null);

  readonly hoy = this._hoy.asReadonly();

  cargar(plan: PlanDia | null): void {
    this._hoy.set(plan);
  }

  /** Guarda el día armado (pantalla 05C "Armar mi día"). */
  async guardarHoy(plan: PlanDia): Promise<void> {
    await this.repo.guardarDia(plan);
    this._hoy.set(plan);
  }
}
