import { inject, Injectable } from '@angular/core';
import { fechaISO, PlanDia } from '../../domain/planificacion/plan.model';
import { PlanStore } from '../stores/plan.store';
import { SeleccionDiaStore } from '../stores/seleccion-dia.store';

/** Convierte las elecciones del flujo del día en el plan de hoy (UNA escritura). */
@Injectable({ providedIn: 'root' })
export class ArmarMiDiaUseCase {
  private readonly seleccion = inject(SeleccionDiaStore);
  private readonly plan = inject(PlanStore);

  async ejecutar(): Promise<PlanDia> {
    const plan: PlanDia = {
      fecha: fechaISO(new Date()),
      elecciones: [...this.seleccion.elecciones()].map(([franja, recetaId]) => ({
        franja,
        recetaId,
      })),
      creadoEn: new Date(),
    };
    await this.plan.guardarHoy(plan);
    this.seleccion.reiniciar();
    return plan;
  }
}
