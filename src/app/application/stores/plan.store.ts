import { computed, inject, Injectable, signal } from '@angular/core';
import { fechaISO, PlanDia, semanaDe } from '../../domain/planificacion/plan.model';
import { PlanRepository } from '../../domain/planificacion/plan.port';

/**
 * Planes por día, en memoria. Hoy llega con la carga inicial;
 * cada semana se lee una sola vez al abrirla (máx. 7 lecturas) y queda en caché.
 */
@Injectable({ providedIn: 'root' })
export class PlanStore {
  private readonly repo = inject(PlanRepository);

  private readonly _porFecha = signal<Map<string, PlanDia>>(new Map());
  private readonly semanasCargadas = new Set<string>();

  readonly porFecha = this._porFecha.asReadonly();
  readonly hoy = computed(() => this._porFecha().get(fechaISO(new Date())) ?? null);

  cargar(plan: PlanDia | null): void {
    if (plan) this.ponerEnMemoria(plan);
  }

  planDe(fecha: string): PlanDia | null {
    return this._porFecha().get(fecha) ?? null;
  }

  async cargarSemana(referencia: Date): Promise<void> {
    const dias = semanaDe(referencia);
    const clave = dias[0]!;
    if (this.semanasCargadas.has(clave)) return;
    const planes = await this.repo.obtenerRango(dias[0]!, dias[6]!);
    const mapa = new Map(this._porFecha());
    for (const p of planes) mapa.set(p.fecha, p);
    this._porFecha.set(mapa);
    this.semanasCargadas.add(clave);
  }

  async guardar(plan: PlanDia): Promise<void> {
    await this.repo.guardarDia(plan);
    this.ponerEnMemoria(plan);
  }

  private ponerEnMemoria(plan: PlanDia): void {
    const mapa = new Map(this._porFecha());
    mapa.set(plan.fecha, plan);
    this._porFecha.set(mapa);
  }
}
