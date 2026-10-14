import { Location } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { DespensaStore } from '../../../application/stores/despensa.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { UiStore } from '../../../application/stores/ui.store';
import { evaluarReceta } from '../../../domain/planificacion/afinidad.service';
import { AfinidadComponent } from '../../ui/afinidad.component';
import { duracion } from '../../ui/iconos';

const MAX_INGREDIENTES = 6;

/** Pantalla 03D: búsqueda activa en memoria por receta, ingrediente o sinónimo. */
@Component({
  selector: 'app-buscar',
  imports: [RouterLink, AfinidadComponent],
  template: `
    <main class="vista">
      <div class="barra">
        <button type="button" class="icono-btn" (click)="volver()" aria-label="Volver"><span class="icono">arrow_back</span></button>
        <label class="buscador activo">
          <span class="icono">search</span>
          <input #campo type="search" placeholder="Busca recetas o ingredientes" [value]="consulta()" (input)="consulta.set($any($event.target).value)" />
          @if (consulta()) {
            <button type="button" class="limpiar" (click)="consulta.set('')" aria-label="Limpiar"><span class="icono">close</span></button>
          }
        </label>
      </div>

      @if (!consulta().trim()) {
        <p class="texto-suave">Prueba con "arveja", "pollo" o "sopa".</p>
      } @else {
        @if (ingredientes().length > 0) {
          <p class="etiqueta-seccion">Ingredientes</p>
          <div class="chips envolver">
            @for (i of ingredientes(); track i.id) {
              <button type="button" class="chip" [class.marcado]="despensa.ids().has(i.id)" (click)="ui.abrirFicha(i.id)">
                @if (despensa.ids().has(i.id)) { <span class="icono">check</span> }
                {{ i.nombre }}
              </button>
            }
          </div>
        }

        <p class="texto-suave">Resultados con "{{ consulta().trim() }}"</p>
        @for (r of resultados(); track r.receta.id) {
          <a class="tarjeta resultado" [routerLink]="['/recetas', r.receta.id]">
            <strong>{{ r.receta.nombre }}</strong>
            <span class="meta">
              {{ catalogos.nombreFranja(r.receta.tipoComida) }} · {{ duracion(r.receta.tiempo.totalMin) }}
              <app-afinidad [puntaje]="r.puntaje" />
            </span>
          </a>
        } @empty {
          <div class="vacio-estado"><span class="icono">search_off</span><p>Ninguna receta coincide.</p></div>
        }
      }
    </main>
  `,
  styles: `
    .barra { display: flex; align-items: center; gap: 6px; margin-left: -8px; }
    .buscador { flex: 1; }
    .buscador.activo { border: 1.5px solid var(--guindo-700); }
    .limpiar { border: none; background: none; padding: 0; display: grid; cursor: pointer; }
    .resultado { display: flex; flex-direction: column; gap: 4px; text-decoration: none; }
    .resultado strong { font-family: 'Quicksand', sans-serif; font-size: 15px; color: var(--plomo-900); }
    .meta { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--plomo-500); }
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
  protected readonly duracion = duracion;

  private readonly coincidentes = computed(() => {
    const q = this.consulta().trim();
    return q ? this.ingredientesStore.buscar(q) : [];
  });

  protected readonly ingredientes = computed(() => this.coincidentes().slice(0, MAX_INGREDIENTES));

  protected readonly resultados = computed(() => {
    const q = this.consulta().trim();
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
