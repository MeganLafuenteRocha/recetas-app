import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { PlanStore } from '../../../application/stores/plan.store';
import { RecetasStore } from '../../../application/stores/recetas.store';

const ICONO_FRANJA: Record<string, string> = {
  desayuno: 'coffee',
  sopa: 'soup_kitchen',
  seco: 'dinner_dining',
  postre: 'cake',
};

/** Pantalla 05C: el menú del día ya armado y guardado. */
@Component({
  selector: 'app-resumen-dia',
  imports: [RouterLink],
  templateUrl: './resumen.page.html',
  styleUrl: './resumen.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumenDiaPage {
  private readonly plan = inject(PlanStore);
  private readonly recetas = inject(RecetasStore);
  private readonly catalogos = inject(CatalogoStore);

  protected readonly elecciones = computed(() => {
    const plan = this.plan.hoy();
    if (!plan) return [];
    return plan.elecciones.map((e) => {
      const receta = this.recetas.obtener(e.recetaId);
      return {
        icono: ICONO_FRANJA[e.franja] ?? 'restaurant',
        franja: this.catalogos.nombreFranja(e.franja),
        nombre: receta?.nombre ?? '—',
        minutos: receta?.tiempo.totalMin ?? null,
      };
    });
  });
}
