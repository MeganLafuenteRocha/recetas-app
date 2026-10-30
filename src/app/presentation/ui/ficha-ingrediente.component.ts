import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogoStore } from '../../application/stores/catalogo.store';
import { DespensaStore } from '../../application/stores/despensa.store';
import { IngredientesStore } from '../../application/stores/ingredientes.store';
import { RecetasStore } from '../../application/stores/recetas.store';
import { UiStore } from '../../application/stores/ui.store';
import { AdministrarIngredientesUseCase } from '../../application/use-cases/administrar-ingredientes.usecase';
import { idsDeIngredientes } from '../../domain/recetas/receta.model';
import { AvisoComponent } from './aviso.component';
import { CabeceraSeccionComponent } from './cabecera-seccion.component';
import { emojiIngrediente } from './emojis';
import { HojaComponent } from './hoja.component';
import { NOMBRE_ROL } from './iconos';
import { FilaAjusteComponent } from './fila-ajuste.component';
import { InterruptorComponent } from './interruptor.component';

const RECETAS_VISIBLES = 3;

/**
 * Pantalla 09: ficha del ingrediente en hoja inferior.
 * Un solo componente para toda la app (receta, despensa, faltantes): vive en el shell.
 */
@Component({
  selector: 'app-ficha-ingrediente',
  imports: [HojaComponent, InterruptorComponent, AvisoComponent, CabeceraSeccionComponent, FilaAjusteComponent],
  template: `
    @if (ingrediente(); as ing) {
      <app-hoja (cerrar)="ui.cerrarFicha()">
        <div class="cabecera-ficha">
          <span class="emoji" aria-hidden="true">{{ emoji() }}</span>
          <div class="titulos">
            <h2>{{ ing.nombre }}</h2>
            <span class="t-detalle">
              {{ catalogos.nombreCategoria(ing.categoria) }}
              @if (ing.sinonimos.length) { · también: {{ ing.sinonimos.join(', ') }} }
            </span>
          </div>
        </div>

        <div class="chips envolver">
          @if (enDespensa()) {
            <span class="pastilla ok"><span class="icono">check_circle</span> En tu despensa</span>
          } @else {
            <span class="pastilla">No está en tu despensa</span>
          }
          @if (rolEnReceta(); as r) {
            <span class="pastilla primario">{{ r }}</span>
          }
          @if (!ing.activo) {
            <span class="pastilla">Archivado</span>
          }
        </div>

        <div class="tarjeta lista">
          <app-fila-ajuste icono="kitchen" etiqueta="Tengo en casa" detalle="Se usa para la afinidad" [flecha]="false">
            <app-interruptor etiqueta="Tengo en casa" [valor]="enDespensa()" (valorChange)="despensa.marcar(ing.id, $event)" />
          </app-fila-ajuste>
          <app-fila-ajuste icono="star" etiqueta="Es básico en mi hogar" detalle="Nunca cuenta como faltante" [flecha]="false">
            <app-interruptor
              etiqueta="Es básico en mi hogar"
              [valor]="ing.esBasico"
              [deshabilitado]="guardando()"
              (valorChange)="cambiarBasico($event)"
            />
          </app-fila-ajuste>
        </div>
        @if (ing.esBasico) {
          <app-aviso icono="info">Al ser básico, todas las recetas lo darán por disponible.</app-aviso>
        }

        @if (recetas().length > 0) {
          <div class="pila">
            <app-cabecera-seccion [titulo]="'Aparece en ' + recetas().length + ' receta' + (recetas().length === 1 ? '' : 's')">
              @if (recetas().length > visibles()) {
                <button type="button" class="btn btn-texto" (click)="visibles.set(recetas().length)">Ver todas</button>
              }
            </app-cabecera-seccion>
            <div class="chips">
              @for (r of recetas().slice(0, visibles()); track r.id) {
                <button type="button" class="chip" (click)="irAReceta(r.id)">{{ r.nombre }}</button>
              }
              @if (recetas().length > visibles()) {
                <button
                  type="button"
                  class="chip suave"
                  (click)="visibles.set(recetas().length)"
                  [attr.aria-label]="'Ver ' + (recetas().length - visibles()) + ' recetas más'"
                >
                  +{{ recetas().length - visibles() }}
                </button>
              }
            </div>
          </div>
        }

        <button type="button" class="btn btn-primario btn-ancho" (click)="ui.cerrarFicha()">
          <span class="icono">check</span> Listo
        </button>
      </app-hoja>
    }
  `,
  styles: `
    .cabecera-ficha { display: flex; align-items: center; gap: 16px; }
    .emoji {
      display: grid;
      place-items: center;
      width: 72px;
      height: 72px;
      flex-shrink: 0;
      border-radius: var(--radio-tarjeta);
      background: var(--color-superficie);
      font-size: 38px;
    }
    .titulos { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    h2 { font-size: 26px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FichaIngredienteComponent {
  protected readonly ui = inject(UiStore);
  protected readonly catalogos = inject(CatalogoStore);
  protected readonly despensa = inject(DespensaStore);
  private readonly ingredientes = inject(IngredientesStore);
  private readonly recetasStore = inject(RecetasStore);
  private readonly administrar = inject(AdministrarIngredientesUseCase);
  private readonly router = inject(Router);

  protected readonly guardando = signal(false);
  /** Se reinicia cada vez que se abre otra ficha. */
  protected readonly visibles = linkedSignal({ source: this.ui.fichaIngrediente, computation: () => RECETAS_VISIBLES });

  protected readonly ingrediente = computed(() => {
    const ficha = this.ui.fichaIngrediente();
    return ficha ? (this.ingredientes.obtener(ficha.id) ?? null) : null;
  });

  protected readonly emoji = computed(() => emojiIngrediente(this.ingrediente() ?? undefined));
  protected readonly enDespensa = computed(() => {
    const ing = this.ingrediente();
    return !!ing && this.despensa.ids().has(ing.id);
  });

  protected readonly recetas = computed(() => {
    const ing = this.ingrediente();
    if (!ing) return [];
    return this.recetasStore.todas().filter((r) => idsDeIngredientes(r).has(ing.id));
  });

  /** "Esencial en Silpancho" cuando la ficha se abrió desde una receta. */
  protected readonly rolEnReceta = computed(() => {
    const ficha = this.ui.fichaIngrediente();
    if (!ficha?.recetaId) return null;
    const receta = this.recetasStore.obtener(ficha.recetaId);
    const espacio = receta?.ingredientes.find((e) => e.opciones.some((o) => o.ingredienteId === ficha.id));
    return receta && espacio ? `${NOMBRE_ROL[espacio.rol]} en ${receta.nombre}` : null;
  });

  protected async cambiarBasico(valor: boolean): Promise<void> {
    const ing = this.ingrediente();
    if (!ing) return;
    this.guardando.set(true);
    try {
      await this.administrar.aplicarEnLote([ing.id], { esBasico: valor });
    } finally {
      this.guardando.set(false);
    }
  }

  protected irAReceta(id: string): void {
    this.ui.cerrarFicha();
    void this.router.navigate(['/recetas', id]);
  }
}
