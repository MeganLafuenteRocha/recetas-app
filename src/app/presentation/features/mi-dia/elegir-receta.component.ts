import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { DespensaStore } from '../../../application/stores/despensa.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { PlanStore } from '../../../application/stores/plan.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { evaluarReceta } from '../../../domain/planificacion/afinidad.service';
import { cambiarEleccion, desdeISO } from '../../../domain/planificacion/plan.model';
import { HojaComponent } from '../../ui/hoja.component';
import { duracion, fechaCorta } from '../../ui/iconos';
import { TarjetaRecetaComponent } from '../../ui/tarjeta-receta.component';

/**
 * Hoja: elegir (o cambiar, o quitar) la receta de una franja de un día. Una escritura.
 * Las opciones siguen ordenadas por afinidad; la afinidad se ve con el estado de cada tarjeta.
 */
@Component({
  selector: 'app-elegir-receta',
  imports: [HojaComponent, TarjetaRecetaComponent],
  template: `
    <app-hoja [titulo]="titulo()" (cerrar)="cerrar.emit()">
      <p class="t-detalle">{{ subtitulo() }} · ordenadas por lo que tienes en casa</p>
      <div class="pila">
        @for (o of opciones(); track o.receta.id) {
          @let elegida = o.receta.id === actual();
          <button
            type="button"
            class="toque"
            [attr.aria-pressed]="elegida"
            [disabled]="guardando()"
            (click)="elegir(o.receta.id)"
          >
            <app-tarjeta-receta [receta]="o.receta" [resultado]="o" [elegida]="elegida">
              <span class="radio marca" [class.marcada]="elegida" aria-hidden="true"></span>
            </app-tarjeta-receta>
          </button>
        } @empty {
          <div class="vacio-estado">
            <span class="icono">menu_book</span>
            <p>Todavía no hay recetas para esta franja.</p>
          </div>
        }
      </div>
      @if (actual()) {
        <button type="button" class="btn btn-peligro btn-ancho" [disabled]="guardando()" (click)="elegir(null)">
          <span class="icono">remove_circle</span> Quitar de este día
        </button>
      }
    </app-hoja>
  `,
  styles: `
    .toque:disabled { opacity: 0.6; cursor: default; }
    .marca { margin-right: 6px; }
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
