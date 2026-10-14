import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { DespensaStore } from '../../../application/stores/despensa.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { PlanStore } from '../../../application/stores/plan.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { evaluarReceta } from '../../../domain/planificacion/afinidad.service';
import { cambiarEleccion, desdeISO } from '../../../domain/planificacion/plan.model';
import { AfinidadComponent } from '../../ui/afinidad.component';
import { HojaComponent } from '../../ui/hoja.component';
import { duracion, fechaCorta } from '../../ui/iconos';

/** Hoja: elegir (o cambiar, o quitar) la receta de una franja de un día. Una escritura. */
@Component({
  selector: 'app-elegir-receta',
  imports: [HojaComponent, AfinidadComponent],
  template: `
    <app-hoja [titulo]="titulo()" (cerrar)="cerrar.emit()">
      <p class="texto-suave">{{ subtitulo() }} · ordenadas por lo que tienes en casa</p>
      <div class="lista-filas">
        @for (o of opciones(); track o.receta.id) {
          <button type="button" class="fila-btn" [disabled]="guardando()" (click)="elegir(o.receta.id)">
            <span class="principal">
              <strong>{{ o.receta.nombre }}</strong>
              <small>{{ duracion(o.receta.tiempo.totalMin) }}{{ o.receta.nutricionPorcion ? ' · ' + o.receta.nutricionPorcion.kcal + ' kcal' : '' }}</small>
            </span>
            <app-afinidad [puntaje]="o.puntaje" />
            <span class="icono" [class.marca]="o.receta.id === actual()">{{ o.receta.id === actual() ? 'radio_button_checked' : 'radio_button_unchecked' }}</span>
          </button>
        }
      </div>
      @if (actual()) {
        <button type="button" class="btn btn-peligro" [disabled]="guardando()" (click)="elegir(null)"><span class="icono">remove_circle</span> Quitar de este día</button>
      }
    </app-hoja>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElegirRecetaComponent {
  private readonly catalogos = inject(CatalogoStore);
  private readonly planes = inject(PlanStore);
  private readonly recetas = inject(RecetasStore);
  private readonly despensa = inject(DespensaStore);
  private readonly ingredientes = inject(IngredientesStore);

  readonly fecha = input.required<string>();
  readonly franja = input.required<string>();
  readonly cerrar = output<void>();

  protected readonly guardando = signal(false);
  protected readonly duracion = duracion;

  protected readonly actual = computed(
    () => this.planes.planDe(this.fecha())?.elecciones.find((e) => e.franja === this.franja())?.recetaId ?? null,
  );
  protected readonly titulo = computed(() => this.catalogos.nombreFranja(this.franja()));
  protected readonly subtitulo = computed(() => fechaCorta(desdeISO(this.fecha())));

  protected readonly opciones = computed(() =>
    this.recetas
      .todas()
      .filter((r) => r.tipoComida === this.franja())
      .map((r) => evaluarReceta(r, this.despensa.ids(), this.ingredientes.basicos()))
      .sort((a, b) => b.puntaje - a.puntaje),
  );

  protected async elegir(recetaId: string | null): Promise<void> {
    this.guardando.set(true);
    try {
      const base = this.planes.planDe(this.fecha()) ?? { fecha: this.fecha(), elecciones: [], creadoEn: null };
      await this.planes.guardar(cambiarEleccion(base, this.franja(), recetaId));
      this.cerrar.emit();
    } finally {
      this.guardando.set(false);
    }
  }
}
