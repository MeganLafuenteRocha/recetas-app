import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { PlanStore } from '../../../application/stores/plan.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { SesionStore } from '../../../application/stores/sesion.store';
import { UiStore } from '../../../application/stores/ui.store';
import { desdeISO, fechaISO, sumarDias } from '../../../domain/planificacion/plan.model';
import { fechaLarga, iconoFranja } from '../../ui/iconos';

/** Días que se muestran después de hoy en "Tu semana". */
const DIAS_SIGUIENTES = 6;

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
      icono: iconoFranja(e.franja),
      franja: this.catalogos.nombreFranja(e.franja),
      receta: this.recetas.obtener(e.recetaId)?.nombre ?? '—',
    }));
  });

  /** Mini-cards de los próximos días (solo los que ya tienen algo planificado). */
  protected readonly proximosDias = computed(() =>
    Array.from({ length: DIAS_SIGUIENTES }, (_, i) => fechaISO(sumarDias(new Date(), i + 1)))
      .map((iso) => ({
        iso,
        etiqueta: desdeISO(iso).toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric' }).replace('.', ''),
        recetas: (this.plan.planDe(iso)?.elecciones ?? [])
          .map((e) => this.recetas.obtener(e.recetaId)?.nombre)
          .filter((n): n is string => !!n),
      }))
      .filter((d) => d.recetas.length > 0),
  );

  constructor() {
    // Esta semana y la que viene (los próximos 6 días pueden cruzar el domingo).
    effect(() => {
      void this.plan.cargarSemana(new Date());
      void this.plan.cargarSemana(sumarDias(new Date(), DIAS_SIGUIENTES));
    });
  }

  protected primerNombre(): string {
    return this.sesion.usuario()?.nombre.split(' ')[0] ?? '';
  }

  protected fechaDeHoy(): string {
    return fechaLarga(new Date());
  }
}
