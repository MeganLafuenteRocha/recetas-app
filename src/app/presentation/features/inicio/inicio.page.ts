import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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

/** Pantalla 04A: menú principal Hero guindo. */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.page.html',
  styleUrl: './inicio.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioPage {
  protected readonly sesion = inject(SesionStore);
  protected readonly ui = inject(UiStore);
  protected readonly plan = inject(PlanStore);
  protected readonly recetas = inject(RecetasStore);
  protected readonly catalogos = inject(CatalogoStore);

  protected readonly hoyArmado = computed(() => {
    const plan = this.plan.hoy();
    if (!plan || plan.elecciones.length === 0) return [];
    return plan.elecciones.map((e) => ({
      icono: ICONO_FRANJA[e.franja] ?? 'restaurant',
      franja: this.catalogos.nombreFranja(e.franja),
      receta: this.recetas.obtener(e.recetaId)?.nombre ?? '—',
    }));
  });

  protected primerNombre(): string {
    return this.sesion.usuario()?.nombre.split(' ')[0] ?? '';
  }

  protected fechaDeHoy(): string {
    return new Date().toLocaleDateString('es-BO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }
}
