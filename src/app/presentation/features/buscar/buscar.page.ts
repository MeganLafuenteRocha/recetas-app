import { Location } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { DespensaStore } from '../../../application/stores/despensa.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { UiStore } from '../../../application/stores/ui.store';
import { evaluarReceta } from '../../../domain/planificacion/afinidad.service';
import { idsDeIngredientes } from '../../../domain/recetas/receta.model';
import { emojiIngrediente } from '../../ui/emojis';
import { FilaIngredienteComponent } from '../../ui/fila-ingrediente.component';
import { TarjetaRecetaComponent } from '../../ui/tarjeta-receta.component';

const MAX_INGREDIENTES = 6;

/** Pantalla 03D (wpBeA): búsqueda activa en memoria por receta, ingrediente o sinónimo. */
@Component({
  selector: 'app-buscar',
  imports: [RouterLink, FilaIngredienteComponent, TarjetaRecetaComponent],
  template: `
    <main class="pantalla">
      <div class="barra">
        <label class="buscador">
          <span class="icono">search</span>
          <span class="solo-lector">Buscar</span>
          <input #campo type="search" placeholder="Busca recetas o ingredientes" [value]="consulta()" (input)="consulta.set($any($event.target).value)" />
          @if (consulta()) {
            <button type="button" class="limpiar" (click)="consulta.set('')" aria-label="Limpiar búsqueda"><span class="icono">close</span></button>
          }
        </label>
        <button type="button" class="btn btn-texto" (click)="volver()">Cancelar</button>
      </div>

      @if (!termino()) {
        <div class="vacio-estado">
          <span class="icono">search</span>
          <p>Prueba con «arveja», «pollo» o «sopa».</p>
        </div>
      } @else {
        @if (ingredientes().length > 0) {
          <div class="tarjeta lista">
            @for (i of ingredientes(); track i.id) {
              <button type="button" class="toque fila" (click)="ui.abrirFicha(i.id)">
                <app-fila-ingrediente [emoji]="i.emoji" [nombre]="i.nombre" [detalle]="i.detalle" [class.marcado]="i.enDespensa">
                  @if (i.recetas > 0) {
                    <span class="cuenta">{{ i.recetas }} {{ i.recetas === 1 ? 'receta' : 'recetas' }}</span>
                  }
                  <span class="icono flecha">chevron_right</span>
                </app-fila-ingrediente>
              </button>
            }
          </div>
        }

        <section class="pila">
          <h2 class="t-sobretitulo">Recetas con {{ termino() }}</h2>
          @for (r of resultados(); track r.receta.id) {
            <a class="toque" [routerLink]="['/recetas', r.receta.id]">
              <app-tarjeta-receta [receta]="r.receta" [resultado]="r" />
            </a>
          } @empty {
            <div class="vacio-estado"><span class="icono">search_off</span><p>Ninguna receta coincide.</p></div>
          }
        </section>
      }
    </main>
  `,
  styles: `
    .barra { display: flex; align-items: center; gap: var(--esp-grupo); }
    .buscador { flex: 1; min-width: 0; }
    .buscador input::-webkit-search-cancel-button { display: none; }
    .limpiar { display: grid; padding: 0; border: none; background: none; color: var(--color-texto-suave); cursor: pointer; }
    .barra .btn-texto { font-size: 13px; }
    .fila { border-radius: 0; }
    .fila + .fila { border-top: 1px solid var(--color-linea); }
    .cuenta { font-size: 13px; color: var(--color-primario); white-space: nowrap; }
    .flecha { color: var(--color-texto-tenue); font-size: 20px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscarPage {
  protected readonly catalogos = inject(CatalogoStore);
  protected readonly despensa = inject(DespensaStore);
  protected readonly ui = inject(UiStore);
  private readonly recetas = inject(RecetasStore);
  private readonly ingredientesStore = inject(IngredientesStore);
  private readonly location = inject(Location);
  private readonly campo = viewChild.required<ElementRef<HTMLInputElement>>('campo');

  protected readonly consulta = signal('');
  protected readonly termino = computed(() => this.consulta().trim());

  private readonly coincidentes = computed(() => {
    const q = this.termino();
    return q ? this.ingredientesStore.buscar(q) : [];
  });

  /** Filas de ingrediente: categoría, si está en la despensa y en cuántas recetas aparece. */
  protected readonly ingredientes = computed(() => {
    const enDespensa = this.despensa.ids();
    const usos = this.recetas.todas().map(idsDeIngredientes);
    return this.coincidentes()
      .slice(0, MAX_INGREDIENTES)
      .map((i) => {
        const tiene = enDespensa.has(i.id);
        const categoria = this.catalogos.nombreCategoria(i.categoria);
        return {
          id: i.id,
          nombre: i.nombre,
          emoji: emojiIngrediente(i),
          enDespensa: tiene,
          detalle: tiene ? `${categoria} · en tu despensa` : categoria,
          recetas: usos.filter((ids) => ids.has(i.id)).length,
        };
      });
  });

  protected readonly resultados = computed(() => {
    const q = this.termino();
    if (!q) return [];
    const ids = new Set(this.coincidentes().map((i) => i.id));
    return this.recetas
      .buscar(q, ids)
      .map((r) => evaluarReceta(r, this.despensa.ids(), this.ingredientesStore.basicos()))
      .sort((a, b) => b.puntaje - a.puntaje);
  });

  constructor() {
    afterNextRender(() => this.campo().nativeElement.focus());
  }

  protected volver(): void {
    this.location.back();
  }
}
