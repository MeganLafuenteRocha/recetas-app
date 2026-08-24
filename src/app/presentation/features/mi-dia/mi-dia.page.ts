import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { PlanStore } from '../../../application/stores/plan.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { SesionStore } from '../../../application/stores/sesion.store';
import { UiStore } from '../../../application/stores/ui.store';

const ICONO_FRANJA: Record<string, string> = {
  desayuno: 'coffee',
  sopa: 'soup_kitchen',
  seco: 'dinner_dining',
  postre: 'cake',
};

/** Pantallas 03A (compacta) y 03B (completa): el plan del día. */
@Component({
  selector: 'app-mi-dia',
  imports: [RouterLink],
  templateUrl: './mi-dia.page.html',
  styleUrl: './mi-dia.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiDiaPage {
  protected readonly ui = inject(UiStore);
  protected readonly sesion = inject(SesionStore);
  private readonly plan = inject(PlanStore);
  private readonly recetas = inject(RecetasStore);
  private readonly catalogos = inject(CatalogoStore);

  /** Toggles del header (estilo TickTick): vista y periodo. */
  protected readonly vistaCompleta = signal(false);
  protected readonly periodoSemanal = signal(false);

  protected readonly inicial = computed(
    () => this.sesion.usuario()?.nombre.charAt(0).toUpperCase() ?? '?',
  );

  protected readonly items = computed(() => {
    const plan = this.plan.hoy();
    if (!plan) return [];
    return plan.elecciones.map((e) => {
      const receta = this.recetas.obtener(e.recetaId);
      return {
        icono: ICONO_FRANJA[e.franja] ?? 'restaurant',
        franja: this.catalogos.nombreFranja(e.franja),
        receta,
      };
    });
  });

  protected fechaDeHoy(): string {
    return new Date().toLocaleDateString('es-BO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }
}
