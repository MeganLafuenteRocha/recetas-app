import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { PlanStore } from '../../../application/stores/plan.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { cambiarEleccion, fechaISO, sumarDias } from '../../../domain/planificacion/plan.model';
import { Receta } from '../../../domain/recetas/receta.model';
import { AvisoComponent } from '../../ui/aviso.component';
import { HojaComponent } from '../../ui/hoja.component';

/** Hoja "Agregar a mi día": elegir día (hoy y 6 más) y franja. Una escritura. */
@Component({
  selector: 'app-agregar-a-dia',
  imports: [HojaComponent, AvisoComponent],
  template: `
    <app-hoja titulo="Agregar a mi día" (cerrar)="cerrar.emit()">
      <div class="pila">
        <h3 class="t-tarjeta">Día</h3>
        <div class="chips">
          @for (d of dias; track d.iso) {
            <button type="button" class="chip dia" [class.activo]="fecha() === d.iso" [attr.aria-pressed]="fecha() === d.iso" (click)="fecha.set(d.iso)">
              <small>{{ d.semana }}</small><strong>{{ d.numero }}</strong>
            </button>
          }
        </div>
      </div>

      <div class="pila">
        <h3 class="t-tarjeta">Franja</h3>
        <div class="segmentos" role="group" aria-label="Franja">
          @for (t of catalogos.tiposComida(); track t.codigo) {
            <button type="button" [class.activo]="franja() === t.codigo" [attr.aria-pressed]="franja() === t.codigo" (click)="franja.set(t.codigo)">{{ t.nombre }}</button>
          }
        </div>
      </div>

      @if (reemplaza(); as nombre) {
        <app-aviso icono="swap_horiz">Reemplaza a {{ nombre }} en esa franja.</app-aviso>
      }

      <button type="button" class="btn btn-primario btn-ancho" [disabled]="guardando()" (click)="guardar()">
        <span class="icono">event_available</span> {{ guardando() ? 'Guardando…' : 'Agregar' }}
      </button>
    </app-hoja>
  `,
  styles: `
    .dia { flex-direction: column; gap: 0; min-width: 52px; padding: 8px 12px; }
    .dia small { font-size: 10px; text-transform: capitalize; }
    .dia strong { font-family: var(--fuente-titulo); font-size: 16px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgregarADiaComponent {
  protected readonly catalogos = inject(CatalogoStore);
  private readonly planes = inject(PlanStore);
  private readonly recetas = inject(RecetasStore);

  readonly receta = input.required<Receta>();
  readonly cerrar = output<void>();
  readonly agregado = output<string>();

  protected readonly guardando = signal(false);
  protected readonly dias = Array.from({ length: 7 }, (_, i) => {
    const d = sumarDias(new Date(), i);
    return {
      iso: fechaISO(d),
      semana: i === 0 ? 'hoy' : d.toLocaleDateString('es-BO', { weekday: 'short' }),
      numero: d.getDate(),
    };
  });
  protected readonly fecha = signal(this.dias[0]!.iso);
  protected readonly franja = linkedSignal(() => this.receta().tipoComida);

  protected readonly reemplaza = computed(() => {
    const actual = this.planes.planDe(this.fecha())?.elecciones.find((e) => e.franja === this.franja());
    if (!actual || actual.recetaId === this.receta().id) return null;
    return this.recetas.obtener(actual.recetaId)?.nombre ?? null;
  });

  constructor() {
    void this.planes.cargarSemana(new Date());
    void this.planes.cargarSemana(sumarDias(new Date(), 6));
  }

  protected async guardar(): Promise<void> {
    this.guardando.set(true);
    try {
      const base = this.planes.planDe(this.fecha()) ?? { fecha: this.fecha(), elecciones: [], creadoEn: null };
      await this.planes.guardar(cambiarEleccion(base, this.franja(), this.receta().id));
      this.agregado.emit(this.fecha());
    } finally {
      this.guardando.set(false);
    }
  }
}
