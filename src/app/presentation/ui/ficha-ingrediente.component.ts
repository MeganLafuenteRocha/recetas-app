import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogoStore } from '../../application/stores/catalogo.store';
import { DespensaStore } from '../../application/stores/despensa.store';
import { IngredientesStore } from '../../application/stores/ingredientes.store';
import { RecetasStore } from '../../application/stores/recetas.store';
import { UiStore } from '../../application/stores/ui.store';
import { AdministrarIngredientesUseCase } from '../../application/use-cases/administrar-ingredientes.usecase';
import { idsDeIngredientes } from '../../domain/recetas/receta.model';
import { HojaComponent } from './hoja.component';
import { iconoCategoria, NOMBRE_ROL } from './iconos';
import { InterruptorComponent } from './interruptor.component';

const RECETAS_VISIBLES = 3;

/**
 * Pantalla 09: ficha del ingrediente en hoja inferior.
 * Un solo componente para toda la app (receta, despensa, faltantes): vive en el shell.
 */
@Component({
  selector: 'app-ficha-ingrediente',
  imports: [HojaComponent, InterruptorComponent],
  template: `
    @if (ingrediente(); as ing) {
      <app-hoja (cerrar)="ui.cerrarFicha()">
        <div class="cabecera-ficha">
          <span class="icono-cat"><span class="icono">{{ icono() }}</span></span>
          <div class="titulos">
            <h2>{{ ing.nombre }}</h2>
            <small>
              {{ catalogos.nombreCategoria(ing.categoria) }}
              @if (ing.sinonimos.length) { · también: {{ ing.sinonimos.join(', ') }} }
            </small>
          </div>
        </div>

        <div class="chips envolver">
          @if (enDespensa()) {
            <span class="chip estado-ok"><span class="icono">check_circle</span> En tu despensa</span>
          } @else {
            <span class="chip suave">No está en tu despensa</span>
          }
          @if (rolEnReceta(); as r) {
            <span class="chip marcado">{{ r }}</span>
          }
          @if (!ing.activo) {
            <span class="chip dorado">Archivado</span>
          }
        </div>

        <div class="lista-filas">
          <div class="fila-ajuste">
            <span class="icono">shopping_basket</span>
            <div class="principal"><strong>Tengo en casa</strong><small>Se usa para la afinidad</small></div>
            <app-interruptor etiqueta="Tengo en casa" [valor]="enDespensa()" (valorChange)="despensa.marcar(ing.id, $event)" />
          </div>
          <div class="fila-ajuste">
            <span class="icono">inventory_2</span>
            <div class="principal"><strong>Es básico en mi hogar</strong><small>Nunca se contará como faltante</small></div>
            <app-interruptor
              etiqueta="Es básico en mi hogar"
              [valor]="ing.esBasico"
              [deshabilitado]="guardando()"
              (valorChange)="cambiarBasico($event)"
            />
          </div>
        </div>
        @if (ing.esBasico) {
          <p class="aviso"><span class="icono">info</span> Al ser básico, todas las recetas lo darán por disponible.</p>
        }

        @if (recetas().length > 0) {
          <div class="recetas">
            <p class="subtitulo">Aparece en {{ recetas().length }} receta{{ recetas().length === 1 ? '' : 's' }}</p>
            <div class="chips envolver">
              @for (r of recetas().slice(0, visibles()); track r.id) {
                <button type="button" class="chip suave" (click)="irAReceta(r.id)">{{ r.nombre }}</button>
              }
              @if (recetas().length > visibles()) {
                <button type="button" class="chip marcado" (click)="visibles.set(recetas().length)">
                  +{{ recetas().length - visibles() }}
                </button>
              }
            </div>
          </div>
        }

        <button type="button" class="btn btn-primario ancho" (click)="ui.cerrarFicha()">Listo</button>
      </app-hoja>
    }
  `,
  styles: `
    .cabecera-ficha { display: flex; align-items: center; gap: 12px; }
    .icono-cat { width: 48px; height: 48px; border-radius: 14px; background: var(--dorado-100); display: grid; place-items: center; flex-shrink: 0; }
    .icono-cat .icono { color: var(--dorado-700); font-size: 26px; }
    .titulos { display: flex; flex-direction: column; min-width: 0; }
    h2 { margin: 0; font-size: 22px; }
    small { color: var(--plomo-500); font-size: 11px; }
    .estado-ok { color: var(--ok); background: #2e7d5b1a; border-color: transparent; }
    .fila-ajuste { display: flex; align-items: center; gap: 12px; padding: 13px 0; }
    .fila-ajuste > .icono { color: var(--plomo-700); font-size: 20px; }
    .principal { flex: 1; display: flex; flex-direction: column; }
    .principal strong { font-size: 13px; font-weight: 500; color: var(--plomo-900); }
    .aviso { margin: -6px 0 0; }
    .recetas { display: flex; flex-direction: column; gap: 8px; }
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

  protected readonly icono = computed(() => iconoCategoria(this.ingrediente()?.categoria ?? ''));
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
